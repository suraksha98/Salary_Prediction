import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify
from flask_compress import Compress

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "indian_salary_prediction_model.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "cleaned_indian_job_market.csv")
COMPARISON_PATH = os.path.join(BASE_DIR, "salary_model_comparison.csv")

app = Flask(__name__, static_folder="static", template_folder="templates")
Compress(app)

# Global variables for model and data cache
model = None
df_cache = None
analytics_cache = {}
metadata_cache = {}
model_info_cache = {}

def format_inr(number):
    """Format number into standard Indian comma notation (e.g., 14,50,000)"""
    try:
        n = int(round(number))
        s = str(n)
        if len(s) <= 3:
            return f"₹{s}"
        last_three = s[-3:]
        other_digits = s[:-3]
        groups = []
        while len(other_digits) > 2:
            groups.insert(0, other_digits[-2:])
            other_digits = other_digits[:-2]
        if other_digits:
            groups.insert(0, other_digits)
        return f"₹{','.join(groups)},{last_three}"
    except Exception:
        return f"₹{number:,.0f}"

def format_lpa(number):
    """Format number in LPA (Lakhs Per Annum)"""
    lacs = number / 100000.0
    if lacs >= 100:
        cr = lacs / 100.0
        return f"₹{cr:.2f} Cr"
    return f"₹{lacs:.2f} LPA"

def calculate_inhand_tax(annual_ctc):
    """
    Calculate Indian New Tax Regime (FY 2024-25 / 2025-26) estimate and monthly in-hand
    Standard deduction = 75,000 INR
    Tax Slabs:
    0 - 3L: 0%
    3L - 7L: 5%
    7L - 10L: 10%
    10L - 12L: 15%
    12L - 15L: 20%
    > 15L: 30%
    Rebate u/s 87A: If taxable income <= 7L, tax is zero.
    """
    annual_ctc = max(0.0, float(annual_ctc))
    basic_annual = annual_ctc * 0.50
    hra_annual = annual_ctc * 0.20
    special_annual = annual_ctc * 0.30
    
    # Employee PF = 12% of basic (capped standard ~3600-4000/mo or 12%)
    pf_annual = min(basic_annual * 0.12, 43200.0)
    prof_tax = 2400.0
    std_deduction = 75000.0
    taxable_income = max(0.0, annual_ctc - std_deduction)
    
    tax = 0.0
    if taxable_income <= 700000.0:
        tax = 0.0 # Full rebate under 87A
    else:
        if taxable_income > 300000:
            tax += min(taxable_income - 300000, 400000) * 0.05
        if taxable_income > 700000:
            tax += min(taxable_income - 700000, 300000) * 0.10
        if taxable_income > 1000000:
            tax += min(taxable_income - 1000000, 200000) * 0.15
        if taxable_income > 1200000:
            tax += min(taxable_income - 1200000, 300000) * 0.20
        if taxable_income > 1500000:
            tax += (taxable_income - 1500000) * 0.30
        
        # 4% Health & Education Cess
        tax *= 1.04

    net_annual = max(0.0, annual_ctc - pf_annual - prof_tax - tax)
    monthly_inhand = net_annual / 12.0

    return {
        "basic_annual_formatted": format_inr(basic_annual),
        "basic_monthly_formatted": format_inr(basic_annual / 12.0),
        "hra_annual_formatted": format_inr(hra_annual),
        "hra_monthly_formatted": format_inr(hra_annual / 12.0),
        "special_annual_formatted": format_inr(special_annual),
        "special_monthly_formatted": format_inr(special_annual / 12.0),
        "pf_monthly_formatted": format_inr(pf_annual / 12.0),
        "tax_annual_formatted": format_inr(tax),
        "tax_monthly_formatted": format_inr(tax / 12.0),
        "monthly_inhand_raw": monthly_inhand,
        "monthly_inhand_formatted": format_inr(monthly_inhand),
        "annual_inhand_formatted": format_inr(net_annual),
        "effective_tax_rate": round((tax / annual_ctc) * 100, 1) if annual_ctc > 0 else 0
    }

def load_resources():
    global model, df_cache, analytics_cache, metadata_cache, model_info_cache
    print("[INIT] Loading Machine Learning Model...")
    try:
        model = joblib.load(MODEL_PATH)
        print("[INIT] Model successfully loaded into memory!")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        model = None

    print("[INIT] Loading Cleaned Job Market Dataset...")
    try:
        if os.path.exists(DATASET_PATH):
            df_cache = pd.read_csv(DATASET_PATH)
            df_cache["target_salary"] = pd.to_numeric(df_cache["target_salary"], errors="coerce")
            df_cache["experience_years"] = pd.to_numeric(df_cache["experience_years"], errors="coerce")
            valid = df_cache["target_salary"].notna() & (df_cache["target_salary"] > 0)
            df_cache = df_cache[valid].copy()
            print(f"[INIT] Loaded {len(df_cache):,} valid job records.")
            precompute_analytics()
        else:
            print(f"[WARN] Dataset file not found at {DATASET_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to load dataset: {e}")

    try:
        if os.path.exists(COMPARISON_PATH):
            comp_df = pd.read_csv(COMPARISON_PATH)
            model_info_cache["comparison"] = comp_df.to_dict(orient="records")
        else:
            model_info_cache["comparison"] = []
    except Exception as e:
        print(f"[WARN] Error reading comparison CSV: {e}")
        model_info_cache["comparison"] = []

def precompute_analytics():
    global analytics_cache, metadata_cache, df_cache
    if df_cache is None or df_cache.empty:
        return

    salaries = df_cache["target_salary"].values
    mean_val = float(np.mean(salaries))
    median_val = float(np.median(salaries))
    p25 = float(np.percentile(salaries, 25))
    p75 = float(np.percentile(salaries, 75))
    p90 = float(np.percentile(salaries, 90))

    analytics_cache["overall_kpis"] = {
        "total_jobs": len(df_cache),
        "mean_salary": mean_val,
        "mean_salary_lpa": format_lpa(mean_val),
        "median_salary": median_val,
        "median_salary_lpa": format_lpa(median_val),
        "p25_salary": p25,
        "p25_salary_lpa": format_lpa(p25),
        "p75_salary": p75,
        "p75_salary_lpa": format_lpa(p75),
        "p90_salary": p90,
        "p90_salary_lpa": format_lpa(p90),
        "min_salary": float(np.min(salaries)),
        "max_salary": float(np.max(salaries))
    }

    # Top 15 Highest Paying Roles (Min 20 listings)
    role_group = (
        df_cache.groupby("title")
        .agg(
            median_salary=("target_salary", "median"),
            mean_salary=("target_salary", "mean"),
            job_count=("target_salary", "count")
        )
        .query("job_count >= 20")
        .sort_values("median_salary", ascending=False)
        .head(15)
        .reset_index()
    )
    analytics_cache["top_paying_roles"] = {
        "titles": role_group["title"].tolist(),
        "median_salaries": [round(s / 100000.0, 2) for s in role_group["median_salary"]],
        "mean_salaries": [round(s / 100000.0, 2) for s in role_group["mean_salary"]],
        "job_counts": role_group["job_count"].tolist()
    }

    # Top 15 Locations
    loc_group = (
        df_cache.groupby("location")
        .agg(
            job_count=("target_salary", "count"),
            median_salary=("target_salary", "median"),
            mean_salary=("target_salary", "mean")
        )
        .query("job_count >= 30")
        .sort_values("job_count", ascending=False)
        .head(15)
        .reset_index()
    )
    analytics_cache["top_locations"] = {
        "locations": loc_group["location"].tolist(),
        "job_counts": loc_group["job_count"].tolist(),
        "median_salaries_lpa": [round(s / 100000.0, 2) for s in loc_group["median_salary"]],
        "mean_salaries_lpa": [round(s / 100000.0, 2) for s in loc_group["mean_salary"]]
    }

    # Experience Curve
    exp_clean = df_cache.dropna(subset=["experience_years", "target_salary"]).copy()
    exp_clean = exp_clean[(exp_clean["experience_years"] >= 0) & (exp_clean["experience_years"] <= 20)]
    exp_group = (
        exp_clean.groupby("experience_years")
        .agg(
            median_salary=("target_salary", "median"),
            p25_salary=("target_salary", lambda x: np.percentile(x, 25)),
            p75_salary=("target_salary", lambda x: np.percentile(x, 75)),
            count=("target_salary", "count")
        )
        .query("count >= 15")
        .reset_index()
        .sort_values("experience_years")
    )
    analytics_cache["experience_curve"] = {
        "years": exp_group["experience_years"].tolist(),
        "median_lpa": [round(s / 100000.0, 2) for s in exp_group["median_salary"]],
        "p25_lpa": [round(s / 100000.0, 2) for s in exp_group["p25_salary"]],
        "p75_lpa": [round(s / 100000.0, 2) for s in exp_group["p75_salary"]],
        "counts": exp_group["count"].tolist()
    }

    # High-Impact Tech Skills
    tech_skills = [
        "Golang", "Spark", "Python", "AWS", "Machine Learning", "Docker",
        "Artificial Intelligence", "DevOps", "Java", "SQL", "Kubernetes",
        "React", "Node.js", "Salesforce", "Power BI", "Tableau", "Cybersecurity",
        "Excel", "Sales"
    ]
    skill_stats = []
    for skill in tech_skills:
        matched = df_cache[df_cache["tagsAndSkills"].astype(str).str.contains(skill, case=False, na=False)]
        if len(matched) >= 15:
            skill_stats.append({
                "skill": skill,
                "count": int(len(matched)),
                "median_lpa": round(float(matched["target_salary"].median()) / 100000.0, 2),
                "mean_lpa": round(float(matched["target_salary"].mean()) / 100000.0, 2)
            })
    skill_stats = sorted(skill_stats, key=lambda x: x["median_lpa"], reverse=True)
    analytics_cache["tech_skills"] = skill_stats

    # Salary Histogram
    hist_salaries = np.clip(salaries / 100000.0, 0, 35)
    counts, bin_edges = np.histogram(hist_salaries, bins=25)
    analytics_cache["salary_distribution"] = {
        "bins": [round(float((bin_edges[i] + bin_edges[i+1])/2), 1) for i in range(len(counts))],
        "bin_labels": [f"{bin_edges[i]:.0f}-{bin_edges[i+1]:.0f}L" for i in range(len(counts))],
        "counts": [int(c) for c in counts]
    }

    top_titles = df_cache["title"].value_counts().head(50).index.tolist()
    top_locs = df_cache["location"].value_counts().head(35).index.tolist()
    metadata_cache = {
        "titles": top_titles,
        "locations": top_locs,
        "total_records": len(df_cache)
    }
    print("[INIT] Analytics precomputed and cached successfully.")

load_resources()

def run_single_inference(job_title, skills, location, min_exp, max_exp, reviews_count, rating):
    job_text = f"{job_title} {skills}".strip()
    input_df = pd.DataFrame([{
        "job_text": job_text,
        "location": location,
        "minimumExperience": float(min_exp),
        "maximumExperience": float(max_exp),
        "ReviewsCount": float(reviews_count),
        "AggregateRating": float(rating)
    }])
    log_pred = model.predict(input_df)[0]
    return float(max(np.expm1(log_pred), 50000.0))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/metadata", methods=["GET"])
def get_metadata():
    return jsonify({
        "status": "success",
        "data": metadata_cache
    })

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    location_filter = request.args.get("location", "All").strip()
    exp_filter = request.args.get("exp_bracket", "All").strip()

    if (location_filter == "All" or not location_filter) and (exp_filter == "All" or not exp_filter):
        return jsonify({
            "status": "success",
            "data": analytics_cache
        })

    filtered = df_cache.copy()
    if location_filter != "All" and location_filter:
        filtered = filtered[filtered["location"].astype(str).str.contains(location_filter, case=False, na=False)]
    
    if exp_filter == "Fresher (0-2 Yrs)":
        filtered = filtered[(filtered["experience_years"] >= 0) & (filtered["experience_years"] <= 2)]
    elif exp_filter == "Mid-Level (3-6 Yrs)":
        filtered = filtered[(filtered["experience_years"] > 2) & (filtered["experience_years"] <= 6)]
    elif exp_filter == "Senior (7-12 Yrs)":
        filtered = filtered[(filtered["experience_years"] > 6) & (filtered["experience_years"] <= 12)]
    elif exp_filter == "Lead / Exec (12+ Yrs)":
        filtered = filtered[filtered["experience_years"] > 12]

    if filtered.empty:
        return jsonify({
            "status": "empty",
            "message": "No job records found matching filters."
        })

    salaries = filtered["target_salary"].values
    mean_val = float(np.mean(salaries))
    median_val = float(np.median(salaries))
    
    hist_salaries = np.clip(salaries / 100000.0, 0, 35)
    counts, bin_edges = np.histogram(hist_salaries, bins=20)

    role_group = (
        filtered.groupby("title")
        .agg(
            median_salary=("target_salary", "median"),
            job_count=("target_salary", "count")
        )
        .query("job_count >= 5")
        .sort_values("median_salary", ascending=False)
        .head(10)
        .reset_index()
    )

    filtered_res = {
        "kpis": {
            "total_jobs": len(filtered),
            "mean_salary": mean_val,
            "mean_salary_lpa": format_lpa(mean_val),
            "median_salary": median_val,
            "median_salary_lpa": format_lpa(median_val)
        },
        "salary_distribution": {
            "bin_labels": [f"{bin_edges[i]:.0f}-{bin_edges[i+1]:.0f}L" for i in range(len(counts))],
            "counts": [int(c) for c in counts]
        },
        "top_roles": {
            "titles": role_group["title"].tolist(),
            "median_salaries": [round(s / 100000.0, 2) for s in role_group["median_salary"]],
            "job_counts": role_group["job_count"].tolist()
        }
    }
    return jsonify({
        "status": "success",
        "data": filtered_res
    })

@app.route("/api/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({
            "status": "error",
            "message": "Model is not loaded on the server. Please check logs."
        }), 500

    try:
        data = request.get_json(force=True)
        job_title = str(data.get("job_title", "Software Engineer")).strip()
        skills = str(data.get("skills", "")).strip()
        location = str(data.get("location", "Bengaluru")).strip()

        try:
            min_exp = float(data.get("minimumExperience", 2.0))
        except (ValueError, TypeError):
            min_exp = 2.0

        try:
            max_exp = float(data.get("maximumExperience", 5.0))
        except (ValueError, TypeError):
            max_exp = 5.0

        if min_exp > max_exp:
            min_exp, max_exp = max_exp, min_exp

        try:
            reviews_count = float(data.get("ReviewsCount", 120.0))
        except (ValueError, TypeError):
            reviews_count = 120.0

        try:
            rating = float(data.get("AggregateRating", 4.1))
            rating = max(1.0, min(5.0, rating))
        except (ValueError, TypeError):
            rating = 4.1

        # Run primary inference
        salary_annual = run_single_inference(job_title, skills, location, min_exp, max_exp, reviews_count, rating)
        salary_monthly = salary_annual / 12.0

        rel_margin = 0.16
        lower_bound = max(salary_annual * (1 - rel_margin), 40000.0)
        upper_bound = salary_annual * (1 + rel_margin)

        percentile = 50.0
        if df_cache is not None and not df_cache.empty:
            salaries = df_cache["target_salary"].values
            percentile = round(float((salaries <= salary_annual).mean() * 100), 1)

        avg_exp = (min_exp + max_exp) / 2.0
        if avg_exp <= 2:
            seniority = "Entry-Level / Fresher"
        elif avg_exp <= 5:
            seniority = "Junior / Mid-Level"
        elif avg_exp <= 10:
            seniority = "Senior Professional"
        else:
            seniority = "Lead / Principal / Executive"

        # 1. In-Hand Monthly & Tax Breakdown
        tax_info = calculate_inhand_tax(salary_annual)

        # 2. Multi-City Comparison Simulation
        key_cities = ["Bengaluru", "Hyderabad", "Pune", "Gurugram", "Mumbai", "Chennai", "Remote"]
        city_benchmark = []
        for city in key_cities:
            sim_sal = run_single_inference(job_title, skills, city, min_exp, max_exp, reviews_count, rating)
            city_benchmark.append({
                "city": city,
                "annual_salary_raw": sim_sal,
                "salary_lpa": format_lpa(sim_sal),
                "is_current": (city.lower() == location.lower())
            })

        return jsonify({
            "status": "success",
            "prediction": {
                "annual_salary_raw": salary_annual,
                "annual_salary_formatted": format_inr(salary_annual),
                "annual_salary_lpa": format_lpa(salary_annual),
                "monthly_salary_raw": salary_monthly,
                "monthly_salary_formatted": format_inr(salary_monthly),
                "lower_bound_formatted": format_inr(lower_bound),
                "lower_bound_lpa": format_lpa(lower_bound),
                "upper_bound_formatted": format_inr(upper_bound),
                "upper_bound_lpa": format_lpa(upper_bound),
                "market_percentile": percentile,
                "seniority_tier": seniority,
                "tax_breakdown": tax_info,
                "city_benchmark": city_benchmark,
                "inputs_echo": {
                    "job_title": job_title,
                    "skills": skills,
                    "location": location,
                    "exp_range": f"{min_exp:.0f} - {max_exp:.0f} Yrs",
                    "rating": f"{rating:.1f} ★ ({int(reviews_count)} Reviews)"
                }
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/compare", methods=["POST"])
def compare_offers():
    """Side-by-side comparator between Offer A and Offer B"""
    try:
        data = request.get_json(force=True)
        prof_a = data.get("offer_a", {})
        prof_b = data.get("offer_b", {})

        sal_a = run_single_inference(
            prof_a.get("job_title", "Software Engineer"),
            prof_a.get("skills", ""),
            prof_a.get("location", "Bengaluru"),
            prof_a.get("minimumExperience", 2),
            prof_a.get("maximumExperience", 5),
            prof_a.get("ReviewsCount", 100),
            prof_a.get("AggregateRating", 4.0)
        )

        sal_b = run_single_inference(
            prof_b.get("job_title", "Data Scientist"),
            prof_b.get("skills", ""),
            prof_b.get("location", "Hyderabad"),
            prof_b.get("minimumExperience", 3),
            prof_b.get("maximumExperience", 6),
            prof_b.get("ReviewsCount", 100),
            prof_b.get("AggregateRating", 4.0)
        )

        tax_a = calculate_inhand_tax(sal_a)
        tax_b = calculate_inhand_tax(sal_b)

        diff_annual = sal_a - sal_b
        percent_diff = round(abs(diff_annual) / max(min(sal_a, sal_b), 1.0) * 100, 1)

        winner = "Offer A" if sal_a >= sal_b else "Offer B"

        return jsonify({
            "status": "success",
            "comparison": {
                "offer_a": {
                    "annual_raw": sal_a,
                    "annual_lpa": format_lpa(sal_a),
                    "annual_formatted": format_inr(sal_a),
                    "monthly_inhand": tax_a["monthly_inhand_formatted"],
                    "tax_rate": tax_a["effective_tax_rate"],
                    "title": prof_a.get("job_title", "Offer A"),
                    "location": prof_a.get("location", "Bengaluru")
                },
                "offer_b": {
                    "annual_raw": sal_b,
                    "annual_lpa": format_lpa(sal_b),
                    "annual_formatted": format_inr(sal_b),
                    "monthly_inhand": tax_b["monthly_inhand_formatted"],
                    "tax_rate": tax_b["effective_tax_rate"],
                    "title": prof_b.get("job_title", "Offer B"),
                    "location": prof_b.get("location", "Hyderabad")
                },
                "delta": {
                    "difference_formatted": format_inr(abs(diff_annual)),
                    "difference_lpa": format_lpa(abs(diff_annual)),
                    "percent_difference": percent_diff,
                    "winner": winner
                }
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/jobs_sample", methods=["GET"])
def get_jobs_sample():
    """Live database search across verified job postings"""
    if df_cache is None or df_cache.empty:
        return jsonify({"status": "error", "message": "Dataset not loaded"}), 500

    query = request.args.get("search", "").strip().lower()
    city = request.args.get("location", "All").strip()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 12))

    filtered = df_cache
    if city != "All" and city:
        filtered = filtered[filtered["location"].astype(str).str.contains(city, case=False, na=False)]

    if query:
        mask = (
            filtered["title"].astype(str).str.lower().str.contains(query, na=False) |
            filtered["tagsAndSkills"].astype(str).str.lower().str.contains(query, na=False) |
            filtered["companyName"].astype(str).str.lower().str.contains(query, na=False)
        )
        filtered = filtered[mask]

    total_records = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_data = filtered.iloc[start_idx:end_idx]

    results = []
    for _, row in page_data.iterrows():
        results.append({
            "title": str(row.get("title", "Unknown Role")),
            "company": str(row.get("companyName", "Confidential")),
            "location": str(row.get("location", "India")),
            "experience": str(row.get("experience", "Not specified")),
            "salary": str(row.get("salary", "Disclosed")),
            "target_salary_lpa": format_lpa(float(row.get("target_salary", 0))),
            "tags": str(row.get("tagsAndSkills", ""))[:120],
            "rating": round(float(row.get("AggregateRating", 4.0)), 1) if pd.notna(row.get("AggregateRating")) else 4.0,
            "reviews": int(row.get("ReviewsCount", 100)) if pd.notna(row.get("ReviewsCount")) else 100,
            "min_exp": float(row.get("minimumExperience", 2)) if pd.notna(row.get("minimumExperience")) else 2,
            "max_exp": float(row.get("maximumExperience", 5)) if pd.notna(row.get("maximumExperience")) else 5
        })

    return jsonify({
        "status": "success",
        "total": total_records,
        "page": page,
        "pages": (total_records + limit - 1) // limit,
        "jobs": results
    })

@app.route("/api/model_info", methods=["GET"])
def get_model_info():
    return jsonify({
        "status": "success",
        "model_name": "Random Forest Regressor (Log-Transformed)",
        "features": [
            {"name": "job_text", "type": "TF-IDF Vectorizer (500 features, 1-2 ngrams)", "details": "Job title combined with extracted skills & tags"},
            {"name": "location", "type": "One-Hot Encoding with Frequency Threshold", "details": "Indian cities & remote hubs"},
            {"name": "Experience & Ratings", "type": "StandardScaler + Median Imputer", "details": "min/max experience, company reviews count, aggregate rating"}
        ],
        "comparison": model_info_cache.get("comparison", []),
        "developer": {
            "name": "Suraksha",
            "role": "AIML Developer",
            "organization": "IPEC Solutions PVT LTD"
        }
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"[*] Starting Indian Job Market Salary Predictor on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
