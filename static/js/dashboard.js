/**
 * Indian Job Market Salary Predictor & Analytics Dashboard (Interactive Suite v2.0)
 * Theme: Chocolate Truffle & Warm Amber
 * Developer: Suraksha, AIML Developer, IPEC Solutions PVT LTD
 */

// 12 Categorized Industry Presets
const PRESETS = {
    // 🧠 AI & Data
    genai_eng: {
        title: "Generative AI Engineer",
        skills: "Python, Large Language Models, PyTorch, LangChain, Transformers, Vector DB, RAG, NLP",
        location: "Bengaluru",
        minExp: 3, maxExp: 6, reviews: 250, rating: 4.4
    },
    data_scientist: {
        title: "Senior Data Scientist",
        skills: "Python, Machine Learning, SQL, Statistics, Deep Learning, NLP, Scikit-learn, Pandas",
        location: "Bengaluru",
        minExp: 4, maxExp: 8, reviews: 320, rating: 4.3
    },
    data_engineer: {
        title: "Senior Data Engineer",
        skills: "Python, SQL, ETL, Spark, AWS, Snowflake, Airflow, Kafka, Data Warehouse",
        location: "Bengaluru",
        minExp: 4, maxExp: 8, reviews: 450, rating: 4.4
    },
    bi_analyst: {
        title: "Data Analyst & BI Specialist",
        skills: "SQL, Power BI, Tableau, Python, Data Modeling, Advanced Excel, Statistics",
        location: "Pune",
        minExp: 2, maxExp: 5, reviews: 140, rating: 4.1
    },

    // 💻 Engineering & Cloud
    java_dev: {
        title: "Java Full Stack Developer",
        skills: "Java, Spring Boot, React, Microservices, REST API, SQL, Docker, Kafka",
        location: "Hyderabad",
        minExp: 3, maxExp: 6, reviews: 210, rating: 4.1
    },
    react_dev: {
        title: "Frontend Developer (React / Next.js)",
        skills: "JavaScript, TypeScript, React, Next.js, Redux, HTML5, CSS3, Tailwind, REST API",
        location: "Gurugram",
        minExp: 2, maxExp: 5, reviews: 180, rating: 4.0
    },
    devops: {
        title: "Cloud & DevOps Architect",
        skills: "AWS, Azure, Docker, Kubernetes, CI/CD, Terraform, Linux, Helm, Ansible",
        location: "Pune",
        minExp: 5, maxExp: 9, reviews: 180, rating: 4.3
    },
    cybersecurity: {
        title: "Cybersecurity Analyst",
        skills: "Information Security, Network Security, SIEM, SOC, Penetration Testing, Python",
        location: "Noida",
        minExp: 3, maxExp: 6, reviews: 130, rating: 4.1
    },

    // 💼 Product & Sales
    product_mgr: {
        title: "Product Manager (B2B SaaS)",
        skills: "Product Strategy, Roadmap, Agile, Scrum, Wireframing, User Research, Analytics",
        location: "Bengaluru",
        minExp: 5, maxExp: 9, reviews: 280, rating: 4.3
    },
    sales_manager: {
        title: "Enterprise Sales Manager",
        skills: "B2B Sales, Enterprise Account Management, Client Relations, CRM, Revenue Growth",
        location: "Mumbai",
        minExp: 5, maxExp: 9, reviews: 140, rating: 4.0
    },
    biz_dev: {
        title: "Business Development Lead",
        skills: "Lead Generation, Client Acquisition, Sales Strategy, Negotiation, Pitching",
        location: "Gurugram",
        minExp: 3, maxExp: 6, reviews: 120, rating: 4.0
    },
    hr_lead: {
        title: "Technical Recruitment Lead",
        skills: "Talent Acquisition, Technical Sourcing, Screening, HR Operations, Stakeholder Mgmt",
        location: "Bengaluru",
        minExp: 4, maxExp: 7, reviews: 150, rating: 4.2
    }
};

// Global pagination state for 33k Jobs Explorer
let currentJobsPage = 1;
let totalJobsPages = 1;

// Chocolate Truffle Plotly Theme Configuration
const PLOTLY_THEME = {
    font: { family: "'Plus Jakarta Sans', sans-serif", color: '#2A1706', size: 12 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    colorway: ['#C05800', '#713600', '#D97706', '#38240D', '#8C4600', '#FF9E40'],
    margin: { l: 60, r: 25, t: 30, b: 50 },
    xaxis: { gridcolor: 'rgba(56, 36, 13, 0.08)', zerolinecolor: 'rgba(56, 36, 13, 0.15)', tickfont: { color: '#4A3521' } },
    yaxis: { gridcolor: 'rgba(56, 36, 13, 0.08)', zerolinecolor: 'rgba(56, 36, 13, 0.15)', tickfont: { color: '#4A3521' } }
};

// Document Ready
document.addEventListener("DOMContentLoaded", () => {
    loadMetadata();
    loadAnalytics();
    syncExperienceSliders();
    fetchSampleJobs(1);

    // Initial default prediction trigger
    document.getElementById("salary-predict-form").dispatchEvent(new Event("submit"));
});

// Main Tab Navigation Switcher
function switchMainTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");

    const activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find(btn => 
        btn.getAttribute("onclick").includes(tabId)
    );
    if (activeBtn) activeBtn.classList.add("active");

    // Re-layout Plotly charts if switching to Analytics tab
    if (tabId === "analytics-tab") {
        window.dispatchEvent(new Event('resize'));
    }
}

// Sync Experience Range Sliders
function syncExperienceSliders() {
    const minInput = document.getElementById("min_exp");
    const maxInput = document.getElementById("max_exp");
    let minVal = parseInt(minInput.value);
    let maxVal = parseInt(maxInput.value);

    if (minVal > maxVal) {
        maxVal = minVal;
        maxInput.value = maxVal;
    }

    document.getElementById("min-exp-val").innerText = minVal;
    document.getElementById("max-exp-val").innerText = maxVal;
}

// Preset Applier
function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;

    document.getElementById("job_title").value = p.title;
    document.getElementById("skills").value = p.skills;
    document.getElementById("location").value = p.location;
    document.getElementById("min_exp").value = p.minExp;
    document.getElementById("max_exp").value = p.maxExp;
    document.getElementById("reviews_count").value = p.reviews;
    document.getElementById("rating").value = p.rating;
    document.getElementById("rating-val").innerText = p.rating;

    // Reset what-if toggles
    document.getElementById("whatif-seniority").checked = false;
    document.getElementById("whatif-bengaluru").checked = false;
    document.getElementById("whatif-cloud").checked = false;

    syncExperienceSliders();
    document.getElementById("salary-predict-form").dispatchEvent(new Event("submit"));
}

// Reset Predictor Form
function resetPredictorForm() {
    document.getElementById("job_title").value = "";
    document.getElementById("skills").value = "";
    document.getElementById("location").value = "Bengaluru";
    document.getElementById("min_exp").value = 2;
    document.getElementById("max_exp").value = 5;
    syncExperienceSliders();
}

// Append Skill Helper Tag
function appendSkill(skill) {
    const textarea = document.getElementById("skills");
    let current = textarea.value.trim();
    if (current.toLowerCase().includes(skill.toLowerCase())) return;

    textarea.value = current.length > 0 ? `${current}, ${skill}` : skill;
    
    // Quick auto-prediction update
    document.getElementById("salary-predict-form").dispatchEvent(new Event("submit"));
}

// What-If Sandbox Toggle Handler
function applyWhatIfSimulation() {
    const isSeniority = document.getElementById("whatif-seniority").checked;
    const isBlr = document.getElementById("whatif-bengaluru").checked;
    const isCloud = document.getElementById("whatif-cloud").checked;

    const minExpInput = document.getElementById("min_exp");
    const maxExpInput = document.getElementById("max_exp");
    const locInput = document.getElementById("location");
    const skillsInput = document.getElementById("skills");

    if (isSeniority) {
        maxExpInput.value = Math.min(30, parseInt(maxExpInput.value) + 2);
    }
    if (isBlr) {
        locInput.value = "Bengaluru";
    }
    if (isCloud && !skillsInput.value.includes("AWS")) {
        skillsInput.value += ", AWS, Azure Cloud";
    }

    syncExperienceSliders();
    document.getElementById("salary-predict-form").dispatchEvent(new Event("submit"));
}

// Load Dropdown Metadata
async function loadMetadata() {
    try {
        const res = await fetch("/api/metadata");
        const json = await res.json();
        if (json.status === "success" && json.data) {
            const titleList = document.getElementById("title-suggestions");
            const locList = document.getElementById("location-suggestions");

            if (json.data.titles) {
                json.data.titles.forEach(t => {
                    const opt = document.createElement("option");
                    opt.value = t;
                    titleList.appendChild(opt);
                });
            }

            if (json.data.locations) {
                json.data.locations.forEach(l => {
                    const opt = document.createElement("option");
                    opt.value = l;
                    locList.appendChild(opt);
                });
            }
        }
    } catch (err) {
        console.warn("Error loading metadata:", err);
    }
}

// Main Prediction Submission
async function handlePrediction(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("predict-submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnSpinner = submitBtn.querySelector(".btn-spinner");

    btnText.style.display = "none";
    btnSpinner.style.display = "inline-flex";
    submitBtn.disabled = true;

    const payload = {
        job_title: document.getElementById("job_title").value,
        skills: document.getElementById("skills").value,
        location: document.getElementById("location").value,
        minimumExperience: document.getElementById("min_exp").value,
        maximumExperience: document.getElementById("max_exp").value,
        ReviewsCount: document.getElementById("reviews_count").value,
        AggregateRating: document.getElementById("rating").value
    };

    try {
        const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.status === "success" && json.prediction) {
            renderPredictionResults(json.prediction);
        } else {
            alert("Prediction error: " + (json.message || "Failed to calculate salary."));
        }
    } catch (err) {
        console.error("Prediction error:", err);
    } finally {
        btnText.style.display = "inline-flex";
        btnSpinner.style.display = "none";
        submitBtn.disabled = false;
    }
}

// Render Prediction Result Panel
function renderPredictionResults(pred) {
    document.getElementById("res-annual-lpa").innerText = pred.annual_salary_lpa;
    document.getElementById("res-annual-formatted").innerText = `(${pred.annual_salary_formatted} / year)`;
    document.getElementById("res-monthly-formatted").innerText = `${pred.monthly_salary_formatted} / month`;
    document.getElementById("res-range-bracket").innerText = `${pred.lower_bound_lpa} — ${pred.upper_bound_lpa}`;
    document.getElementById("res-seniority-tier").innerText = pred.seniority_tier;

    // Percentile
    const p = Math.min(Math.max(pred.market_percentile, 5), 98);
    document.getElementById("res-percentile").innerText = `Top ${100 - p}% in India`;
    document.getElementById("res-percentile-fill").style.width = `${p}%`;

    // Indian New Tax Regime Breakdown
    if (pred.tax_breakdown) {
        const tb = pred.tax_breakdown;
        document.getElementById("res-tax-rate").innerText = `Tax: ~${tb.effective_tax_rate}%`;
        document.getElementById("tax-basic").innerText = `${tb.basic_monthly_formatted} / mo`;
        document.getElementById("tax-hra").innerText = `${tb.hra_monthly_formatted} / mo`;
        document.getElementById("tax-special").innerText = `${tb.special_monthly_formatted} / mo`;
        document.getElementById("tax-pf").innerText = `- ${tb.pf_monthly_formatted} / mo`;
        document.getElementById("tax-deduct").innerText = `- ${tb.tax_monthly_formatted} / mo`;
        document.getElementById("tax-net-monthly").innerText = `${tb.monthly_inhand_formatted} / mo`;
    }

    // Multi-City Benchmark Comparison
    if (pred.city_benchmark) {
        const listContainer = document.getElementById("city-benchmark-list");
        listContainer.innerHTML = "";
        pred.city_benchmark.forEach(item => {
            const div = document.createElement("div");
            div.className = `city-bench-item ${item.is_current ? 'active-city' : ''}`;
            div.innerHTML = `
                <span class="city-name">${item.city}</span>
                <span class="city-sal">${item.salary_lpa}</span>
            `;
            div.onclick = () => {
                document.getElementById("location").value = item.city;
                document.getElementById("salary-predict-form").dispatchEvent(new Event("submit"));
            };
            listContainer.appendChild(div);
        });
    }

    // Bounce animation
    const panel = document.getElementById("prediction-result-panel");
    panel.style.transform = "scale(1.015)";
    setTimeout(() => { panel.style.transform = "scale(1)"; }, 250);
}

// Send Current Predictor Data to Dual Offer Comparator
function sendToComparator() {
    document.getElementById("comp-title-a").value = document.getElementById("job_title").value;
    document.getElementById("comp-skills-a").value = document.getElementById("skills").value;
    document.getElementById("comp-loc-a").value = document.getElementById("location").value;
    document.getElementById("comp-exp-a").value = document.getElementById("max_exp").value;

    switchMainTab("comparator-tab");
    runDualComparison();
}

// Run Dual Offer Comparison
async function runDualComparison() {
    const payload = {
        offer_a: {
            job_title: document.getElementById("comp-title-a").value,
            skills: document.getElementById("comp-skills-a").value,
            location: document.getElementById("comp-loc-a").value,
            minimumExperience: Math.max(0, parseInt(document.getElementById("comp-exp-a").value) - 2),
            maximumExperience: parseInt(document.getElementById("comp-exp-a").value),
            ReviewsCount: 150, AggregateRating: 4.1
        },
        offer_b: {
            job_title: document.getElementById("comp-title-b").value,
            skills: document.getElementById("comp-skills-b").value,
            location: document.getElementById("comp-loc-b").value,
            minimumExperience: Math.max(0, parseInt(document.getElementById("comp-exp-b").value) - 2),
            maximumExperience: parseInt(document.getElementById("comp-exp-b").value),
            ReviewsCount: 150, AggregateRating: 4.1
        }
    };

    try {
        const res = await fetch("/api/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.status === "success" && json.comparison) {
            const c = json.comparison;
            document.getElementById("comp-lpa-a").innerText = c.offer_a.annual_lpa;
            document.getElementById("comp-monthly-a").innerText = `Take-Home: ${c.offer_a.monthly_inhand} / mo`;

            document.getElementById("comp-lpa-b").innerText = c.offer_b.annual_lpa;
            document.getElementById("comp-monthly-b").innerText = `Take-Home: ${c.offer_b.monthly_inhand} / mo`;

            // Verdict
            const verdictBox = document.getElementById("comp-verdict-box");
            verdictBox.style.display = "block";
            document.getElementById("verdict-winner").innerText = `${c.delta.winner} Leads`;
            document.getElementById("verdict-diff-val").innerText = `+${c.delta.difference_lpa}`;
            document.getElementById("verdict-diff-pct").innerText = `${c.delta.percent_difference}% Higher Annual Package`;
        }
    } catch (err) {
        console.error("Comparison error:", err);
    }
}

// 33k Jobs Explorer: Fetch & Render Table
async function fetchSampleJobs(page = 1) {
    currentJobsPage = page;
    const query = document.getElementById("job-search-input").value.trim();
    const city = document.getElementById("job-search-city").value;

    const url = `/api/jobs_sample?search=${encodeURIComponent(query)}&location=${encodeURIComponent(city)}&page=${page}&limit=12`;
    const tbody = document.getElementById("jobs-table-body");
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Searching verified job postings...</td></tr>`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === "success") {
            totalJobsPages = json.pages;
            document.getElementById("current-page-num").innerText = `Page ${json.page} of ${json.pages}`;
            document.getElementById("jobs-count-text").innerText = `Found ${json.total.toLocaleString()} verified listings`;
            document.getElementById("btn-prev-page").disabled = (json.page <= 1);
            document.getElementById("btn-next-page").disabled = (json.page >= json.pages);

            if (json.jobs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No matching job records found. Try a different search term.</td></tr>`;
                return;
            }

            tbody.innerHTML = "";
            json.jobs.forEach(job => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>
                        <div class="job-role-title">${escapeHtml(job.title)}</div>
                        <div class="job-comp-name"><i class="fa-solid fa-building"></i> ${escapeHtml(job.company)}</div>
                    </td>
                    <td><i class="fa-solid fa-location-dot"></i> ${escapeHtml(job.location)}</td>
                    <td>${escapeHtml(job.experience)}</td>
                    <td><strong>${escapeHtml(job.salary)}</strong></td>
                    <td><span class="text-amber"><strong>${job.target_salary_lpa}</strong></span></td>
                    <td>
                        <div style="max-width:240px; font-size:0.75rem; color:#6B5744;">${escapeHtml(job.tags)}</div>
                        <div style="font-size:0.75rem; margin-top:2px;">★ ${job.rating} (${job.reviews} reviews)</div>
                    </td>
                    <td>
                        <button type="button" class="btn btn-secondary btn-sm" onclick='loadJobIntoPredictor(${JSON.stringify(job).replace(/'/g, "&apos;")})'>
                            <i class="fa-solid fa-bolt"></i> Simulate
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error loading job records.</td></tr>`;
    }
}

function handleJobSearchKeyup(e) {
    if (e.key === "Enter") {
        fetchSampleJobs(1);
    }
}

function changeJobsPage(delta) {
    const newPage = currentJobsPage + delta;
    if (newPage >= 1 && newPage <= totalJobsPages) {
        fetchSampleJobs(newPage);
    }
}

// 1-Click Load from Table to Predictor
function loadJobIntoPredictor(job) {
    document.getElementById("job_title").value = job.title;
    document.getElementById("skills").value = job.tags || "";
    document.getElementById("location").value = job.location;
    document.getElementById("min_exp").value = Math.min(30, Math.max(0, Math.round(job.min_exp || 2)));
    document.getElementById("max_exp").value = Math.min(30, Math.max(0, Math.round(job.max_exp || 5)));
    document.getElementById("reviews_count").value = job.reviews || 120;
    document.getElementById("rating").value = job.rating || 4.1;
    document.getElementById("rating-val").innerText = job.rating || 4.1;

    syncExperienceSliders();
    switchMainTab("predictor-tab");
    document.getElementById("salary-predict-form").dispatchEvent(new Event("submit"));
}

// Analytics Visualizations (Plotly.js)
async function loadAnalytics() {
    try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.status === "success" && json.data) {
            renderAnalyticsCharts(json.data);
            if (json.data.overall_kpis) {
                updateHeroKpis(json.data.overall_kpis);
            }
        }
    } catch (err) {
        console.error("Error loading analytics:", err);
    }
}

function updateHeroKpis(kpis) {
    document.getElementById("kpi-total-jobs").innerText = Number(kpis.total_jobs).toLocaleString();
    document.getElementById("kpi-mean-salary").innerText = kpis.mean_salary_lpa;
    document.getElementById("kpi-median-salary").innerText = kpis.median_salary_lpa;
    document.getElementById("kpi-p90-salary").innerText = kpis.p90_salary_lpa;
}

function renderAnalyticsCharts(data) {
    // 1. Salary Distribution Chart
    if (data.salary_distribution) {
        const traceDist = {
            x: data.salary_distribution.bin_labels,
            y: data.salary_distribution.counts,
            type: 'bar',
            marker: { color: '#C05800', opacity: 0.85, line: { color: '#713600', width: 1.5 } },
            hovertemplate: 'Salary Range: %{x}<br>Job Listings: %{y:,}<extra></extra>'
        };
        const layoutDist = {
            ...PLOTLY_THEME,
            xaxis: { ...PLOTLY_THEME.xaxis, title: 'Annual Salary Bracket (₹ Lakhs)' },
            yaxis: { ...PLOTLY_THEME.yaxis, title: 'Number of Jobs' }
        };
        Plotly.newPlot('chart-salary-dist', [traceDist], layoutDist, { responsive: true, displayModeBar: false });
    }

    // 2. Top Paying Roles Chart
    if (data.top_paying_roles) {
        const roles = data.top_paying_roles;
        const traceRoles = {
            y: roles.titles.slice().reverse(),
            x: roles.median_salaries.slice().reverse(),
            type: 'bar',
            orientation: 'h',
            marker: {
                color: roles.median_salaries.slice().reverse().map((_, i) => `hsl(${28 + i * 2}, 100%, ${30 + i * 2}%)`),
                line: { color: '#38240D', width: 1 }
            },
            hovertemplate: 'Role: %{y}<br>Median Package: ₹%{x:.2f} LPA<extra></extra>'
        };
        const layoutRoles = {
            ...PLOTLY_THEME,
            margin: { l: 170, r: 25, t: 20, b: 50 },
            xaxis: { ...PLOTLY_THEME.xaxis, title: 'Median Annual Salary (₹ Lakhs)' },
            yaxis: { ...PLOTLY_THEME.yaxis, automargin: true }
        };
        Plotly.newPlot('chart-top-roles', [traceRoles], layoutRoles, { responsive: true, displayModeBar: false });
    }

    // 3. Tech Hubs Comparison
    if (data.top_locations) {
        const locs = data.top_locations;
        const traceLoc = {
            x: locs.locations,
            y: locs.median_salaries_lpa,
            text: locs.job_counts.map(c => `${c} Jobs`),
            type: 'bar',
            marker: { color: '#713600', line: { color: '#38240D', width: 1 } },
            hovertemplate: 'City: %{x}<br>Median CTC: ₹%{y:.2f} LPA<br>Verified Postings: %{text}<extra></extra>'
        };
        const layoutLoc = {
            ...PLOTLY_THEME,
            margin: { l: 50, r: 25, t: 20, b: 80 },
            xaxis: { ...PLOTLY_THEME.xaxis, tickangle: -35 },
            yaxis: { ...PLOTLY_THEME.yaxis, title: 'Median Salary (₹ LPA)' }
        };
        Plotly.newPlot('chart-tech-hubs', [traceLoc], layoutLoc, { responsive: true, displayModeBar: false });
    }

    // 4. Experience vs Salary Curve
    if (data.experience_curve) {
        const exp = data.experience_curve;
        const traceP75 = { x: exp.years, y: exp.p75_lpa, mode: 'lines', line: { width: 0 }, showlegend: false, hoverinfo: 'none' };
        const traceP25 = {
            x: exp.years, y: exp.p25_lpa, fill: 'tonexty', fillcolor: 'rgba(192, 88, 0, 0.15)',
            mode: 'lines', line: { width: 0 }, name: '25th - 75th Range', hoverinfo: 'none'
        };
        const traceMedian = {
            x: exp.years, y: exp.median_lpa, mode: 'lines+markers', name: 'Median Compensation',
            line: { color: '#C05800', width: 3 }, marker: { color: '#38240D', size: 6 },
            hovertemplate: 'Exp: %{x} Years<br>Median CTC: ₹%{y:.2f} LPA<extra></extra>'
        };
        const layoutExp = {
            ...PLOTLY_THEME,
            showlegend: true,
            legend: { orientation: 'h', y: 1.15, x: 0.1 },
            xaxis: { ...PLOTLY_THEME.xaxis, title: 'Years of Experience' },
            yaxis: { ...PLOTLY_THEME.yaxis, title: 'Annual Compensation (₹ LPA)' }
        };
        Plotly.newPlot('chart-experience-curve', [traceP75, traceP25, traceMedian], layoutExp, { responsive: true, displayModeBar: false });
    }

    // 5. Tech Skills
    if (data.tech_skills) {
        const skills = data.tech_skills;
        const traceSkills = {
            x: skills.map(s => s.skill),
            y: skills.map(s => s.median_lpa),
            type: 'bar',
            marker: {
                color: skills.map(s => s.median_lpa >= 17 ? '#C05800' : (s.median_lpa >= 14 ? '#713600' : '#8C6239')),
                line: { color: '#38240D', width: 1 }
            },
            hovertemplate: 'Skill: %{x}<br>Median Market CTC: ₹%{y:.2f} LPA<extra></extra>'
        };
        const layoutSkills = {
            ...PLOTLY_THEME,
            margin: { l: 50, r: 25, t: 20, b: 80 },
            xaxis: { ...PLOTLY_THEME.xaxis, tickangle: -30, title: 'Key Technical & Strategic Skills' },
            yaxis: { ...PLOTLY_THEME.yaxis, title: 'Median Salary Package (₹ LPA)' }
        };
        Plotly.newPlot('chart-tech-skills', [traceSkills], layoutSkills, { responsive: true, displayModeBar: false });
    }
}

// Analytics Filter
async function applyAnalyticsFilters() {
    const loc = document.getElementById("filter-location").value;
    const exp = document.getElementById("filter-exp").value;
    const url = `/api/analytics?location=${encodeURIComponent(loc)}&exp_bracket=${encodeURIComponent(exp)}`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === "success" && json.data) {
            if (json.data.salary_distribution) {
                const traceDist = {
                    x: json.data.salary_distribution.bin_labels,
                    y: json.data.salary_distribution.counts,
                    type: 'bar',
                    marker: { color: '#C05800', opacity: 0.85, line: { color: '#713600', width: 1.5 } },
                    hovertemplate: 'Bracket: %{x}<br>Postings: %{y:,}<extra></extra>'
                };
                Plotly.react('chart-salary-dist', [traceDist], { ...PLOTLY_THEME, xaxis: { ...PLOTLY_THEME.xaxis, title: 'Annual Salary Bracket (₹ Lakhs)' } });
            }
            if (json.data.top_roles && json.data.top_roles.titles.length > 0) {
                const roles = json.data.top_roles;
                const traceRoles = {
                    y: roles.titles.slice().reverse(),
                    x: roles.median_salaries.slice().reverse(),
                    type: 'bar',
                    orientation: 'h',
                    marker: { color: '#713600' },
                    hovertemplate: 'Role: %{y}<br>Median Package: ₹%{x:.2f} LPA<extra></extra>'
                };
                Plotly.react('chart-top-roles', [traceRoles], { ...PLOTLY_THEME, margin: { l: 170, r: 25, t: 20, b: 50 } });
            }
            if (json.data.kpis) {
                document.getElementById("kpi-total-jobs").innerText = Number(json.data.kpis.total_jobs).toLocaleString();
                document.getElementById("kpi-mean-salary").innerText = json.data.kpis.mean_salary_lpa;
                document.getElementById("kpi-median-salary").innerText = json.data.kpis.median_salary_lpa;
            }
        }
    } catch (err) {
        console.error("Filter error:", err);
    }
}

function resetAnalyticsFilters() {
    document.getElementById("filter-location").value = "All";
    document.getElementById("filter-exp").value = "All";
    loadAnalytics();
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
