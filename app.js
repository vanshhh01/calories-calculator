// GlowCal AI — Application Logic

document.addEventListener("DOMContentLoaded", () => {
  // --- STATE SYSTEM ---
  const state = {
    dailyGoal: 2000,
    apiKey: (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) ? CONFIG.API_KEY : "YOUR_API_KEY_HERE",
    selectedModel: "google/gemini-2.5-flash",
    loggedMeals: [],
    magicTheme: false,
    
    // Hydration tracking
    waterTarget: 2000,
    waterLogged: 0,
    
    // Macros Configuration
    dietPreset: "balanced",
    customRatios: { protein: 30, carbs: 45, fat: 25 }
  };

  // Diet Profile Definitions
  const DIET_PRESETS = {
    "balanced": { protein: 30, carbs: 45, fat: 25 },
    "high-protein": { protein: 40, carbs: 30, fat: 30 },
    "low-carb": { protein: 35, carbs: 15, fat: 50 },
    "keto": { protein: 20, carbs: 5, fat: 75 }
  };

  // --- UI ELEMENTS ---
  const foodForm = document.getElementById("foodForm");
  const foodInput = document.getElementById("foodInput");
  const portionInput = document.getElementById("portionInput");
  const autocompleteList = document.getElementById("autocompleteList");
  const clearInputBtn = document.getElementById("clearInputBtn");
  const submitFoodBtn = document.getElementById("submitFoodBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  
  // Portion Suggestion Chips
  const portionChipsContainer = document.getElementById("portionChipsContainer");
  const portionChips = document.getElementById("portionChips");
  
  // Dashboard indicators
  const progressRingBar = document.getElementById("progressRingBar");
  const caloriesRemainingVal = document.getElementById("caloriesRemainingVal");
  const caloriesSubtext = document.getElementById("caloriesSubtext");
  const caloriesGoalText = document.getElementById("caloriesGoalText");
  const caloriesEatenText = document.getElementById("caloriesEatenText");
  
  // Macros indicators
  const activePresetBadge = document.getElementById("activePresetBadge");
  const proteinCurrent = document.getElementById("proteinCurrent");
  const proteinGoal = document.getElementById("proteinGoal");
  const proteinBar = document.getElementById("proteinBar");
  
  const carbsCurrent = document.getElementById("carbsCurrent");
  const carbsGoal = document.getElementById("carbsGoal");
  const carbsBar = document.getElementById("carbsBar");
  
  const fatCurrent = document.getElementById("fatCurrent");
  const fatGoal = document.getElementById("fatGoal");
  const fatBar = document.getElementById("fatBar");

  // Hydration widgets
  const waterFluid = document.getElementById("waterFluid");
  const waterLoggedText = document.getElementById("waterLoggedText");
  const waterTargetText = document.getElementById("waterTargetText");
  const resetWaterBtn = document.getElementById("resetWaterBtn");
  const waterAddButtons = document.querySelectorAll(".water-add-btn");

  // Journal log list
  const emptyJournalState = document.getElementById("emptyJournalState");
  const journalList = document.getElementById("journalList");
  const clearAllBtn = document.getElementById("clearAllBtn");

  // Settings elements
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const settingsForm = document.getElementById("settingsForm");
  const settingsCalorieGoal = document.getElementById("settingsCalorieGoal");
  const settingsDietPreset = document.getElementById("settingsDietPreset");
  const customRatiosContainer = document.getElementById("customRatiosContainer");
  const customProteinRatio = document.getElementById("customProteinRatio");
  const customCarbsRatio = document.getElementById("customCarbsRatio");
  const customFatRatio = document.getElementById("customFatRatio");
  const customRatiosTotalLabel = document.getElementById("customRatiosTotalLabel");
  const settingsModel = document.getElementById("settingsModel");
  const settingsApiKey = document.getElementById("settingsApiKey");
  const toggleApiKeyVisibility = document.getElementById("toggleApiKeyVisibility");
  const apiKeyEyeIcon = document.getElementById("apiKeyEyeIcon");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const toastContainer = document.getElementById("toastContainer");

  // Keyboard navigation for autocomplete
  let activeAutocompleteIndex = -1;

  // --- LOCAL STORAGE & INIT ---
  function loadState() {
    const savedGoal = localStorage.getItem("glowcal_daily_goal");
    const savedApiKey = localStorage.getItem("glowcal_api_key");
    const savedModel = localStorage.getItem("glowcal_selected_model");
    const savedMeals = localStorage.getItem("glowcal_logged_meals");
    const savedTheme = localStorage.getItem("glowcal_magic_theme");
    const savedWater = localStorage.getItem("glowcal_water_logged");
    const savedDietPreset = localStorage.getItem("glowcal_diet_preset");
    const savedCustomRatios = localStorage.getItem("glowcal_custom_ratios");

    if (savedGoal) state.dailyGoal = parseInt(savedGoal, 10);
    if (savedApiKey) state.apiKey = savedApiKey;
    if (savedModel) state.selectedModel = savedModel;
    if (savedMeals) state.loggedMeals = JSON.parse(savedMeals);
    if (savedTheme) state.magicTheme = savedTheme === "true";
    if (savedWater) state.waterLogged = parseInt(savedWater, 10);
    if (savedDietPreset) state.dietPreset = savedDietPreset;
    if (savedCustomRatios) state.customRatios = JSON.parse(savedCustomRatios);

    // Apply Settings parameters
    settingsCalorieGoal.value = state.dailyGoal;
    settingsModel.value = state.selectedModel;
    settingsApiKey.value = state.apiKey;
    settingsDietPreset.value = state.dietPreset;
    
    customProteinRatio.value = state.customRatios.protein;
    customCarbsRatio.value = state.customRatios.carbs;
    customFatRatio.value = state.customRatios.fat;

    if (state.dietPreset === "custom") {
      customRatiosContainer.style.display = "grid";
    } else {
      customRatiosContainer.style.display = "none";
    }

    // Apply Theme
    if (state.magicTheme) {
      document.body.classList.add("magic-theme");
    } else {
      document.body.classList.remove("magic-theme");
    }

    validateRatiosTotal();
  }

  function saveState() {
    localStorage.setItem("glowcal_daily_goal", state.dailyGoal);
    localStorage.setItem("glowcal_api_key", state.apiKey);
    localStorage.setItem("glowcal_selected_model", state.selectedModel);
    localStorage.setItem("glowcal_logged_meals", JSON.stringify(state.loggedMeals));
    localStorage.setItem("glowcal_magic_theme", state.magicTheme);
    localStorage.setItem("glowcal_water_logged", state.waterLogged);
    localStorage.setItem("glowcal_diet_preset", state.dietPreset);
    localStorage.setItem("glowcal_custom_ratios", JSON.stringify(state.customRatios));
  }

  // Initialize
  loadState();
  updateDashboard();
  updateWaterUI();

  // --- HYDROLOGY (WATER) TRACKER LOGIC ---
  waterAddButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const amount = parseInt(btn.getAttribute("data-amount"), 10);
      state.waterLogged += amount;
      saveState();
      updateWaterUI();
      showToast(`Logged +${amount}ml of Water 💧`, "success");
    });
  });

  resetWaterBtn.addEventListener("click", () => {
    state.waterLogged = 0;
    saveState();
    updateWaterUI();
    showToast("Water log reset.", "info");
  });

  function updateWaterUI() {
    waterLoggedText.textContent = state.waterLogged.toLocaleString();
    waterTargetText.textContent = state.waterTarget.toLocaleString();
    
    // Calculate percentage fill height (cap at 100)
    const percentage = Math.min((state.waterLogged / state.waterTarget) * 100, 100);
    waterFluid.style.height = `${percentage}%`;
  }

  // --- THEME & SETTINGS CONTROLLERS ---
  themeToggleBtn.addEventListener("click", () => {
    state.magicTheme = !state.magicTheme;
    if (state.magicTheme) {
      document.body.classList.add("magic-theme");
      showToast("Magic theme activated! ✨", "info");
    } else {
      document.body.classList.remove("magic-theme");
      showToast("Default theme restored.", "info");
    }
    saveState();
    // Re-draw circular progress
    setTimeout(updateDashboard, 50);
  });

  // Modal open/close
  openSettingsBtn.addEventListener("click", () => {
    settingsCalorieGoal.value = state.dailyGoal;
    settingsModel.value = state.selectedModel;
    settingsApiKey.value = state.apiKey;
    settingsDietPreset.value = state.dietPreset;
    
    customProteinRatio.value = state.customRatios.protein;
    customCarbsRatio.value = state.customRatios.carbs;
    customFatRatio.value = state.customRatios.fat;

    if (state.dietPreset === "custom") {
      customRatiosContainer.style.display = "grid";
    } else {
      customRatiosContainer.style.display = "none";
    }

    validateRatiosTotal();
    settingsModal.classList.add("active");
  });

  function closeSettings() {
    settingsModal.classList.remove("active");
  }

  closeSettingsBtn.addEventListener("click", closeSettings);
  cancelSettingsBtn.addEventListener("click", closeSettings);
  
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  // Toggle API key visibility
  toggleApiKeyVisibility.addEventListener("click", () => {
    if (settingsApiKey.type === "password") {
      settingsApiKey.type = "text";
      apiKeyEyeIcon.className = "fa-solid fa-eye";
      toggleApiKeyVisibility.innerHTML = `<i class="fa-solid fa-eye"></i> Hide Key`;
    } else {
      settingsApiKey.type = "password";
      apiKeyEyeIcon.className = "fa-solid fa-eye-slash";
      toggleApiKeyVisibility.innerHTML = `<i class="fa-solid fa-eye-slash"></i> Show Key`;
    }
  });

  // Preset Ratio Changed
  settingsDietPreset.addEventListener("change", (e) => {
    state.dietPreset = e.target.value;
    if (state.dietPreset === "custom") {
      customRatiosContainer.style.display = "grid";
    } else {
      customRatiosContainer.style.display = "none";
    }
    validateRatiosTotal();
  });

  // Inputs change validator
  [customProteinRatio, customCarbsRatio, customFatRatio].forEach(input => {
    input.addEventListener("input", validateRatiosTotal);
  });

  function validateRatiosTotal() {
    const p = parseInt(customProteinRatio.value, 10) || 0;
    const c = parseInt(customCarbsRatio.value, 10) || 0;
    const f = parseInt(customFatRatio.value, 10) || 0;
    const total = p + c + f;

    if (state.dietPreset === "custom") {
      customRatiosTotalLabel.textContent = `Total: ${total}%`;
      if (total !== 100) {
        customRatiosTotalLabel.className = "ratio-total-label invalid";
        // Disable save button
        settingsForm.querySelector("button[type='submit']").disabled = true;
      } else {
        customRatiosTotalLabel.className = "ratio-total-label";
        settingsForm.querySelector("button[type='submit']").disabled = false;
      }
    } else {
      settingsForm.querySelector("button[type='submit']").disabled = false;
    }
  }

  // Save Settings Form
  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.dailyGoal = parseInt(settingsCalorieGoal.value, 10);
    state.selectedModel = settingsModel.value;
    state.apiKey = settingsApiKey.value.trim();
    state.dietPreset = settingsDietPreset.value;

    if (state.dietPreset === "custom") {
      state.customRatios.protein = parseInt(customProteinRatio.value, 10) || 0;
      state.customRatios.carbs = parseInt(customCarbsRatio.value, 10) || 0;
      state.customRatios.fat = parseInt(customFatRatio.value, 10) || 0;
    }

    saveState();
    updateDashboard();
    closeSettings();
    showToast("Configuration saved successfully!", "success");
  });

  // --- AUTOCOMPLETE LOGIC ---
  foodInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    // Show/hide clear button
    clearInputBtn.style.display = e.target.value ? "flex" : "none";

    if (!query) {
      closeAutocomplete();
      hidePortionChips();
      return;
    }

    // Filter local common food items
    const matches = COMMON_FOODS.filter(food => 
      food.name.toLowerCase().includes(query)
    ).slice(0, 6);

    if (matches.length > 0) {
      renderAutocomplete(matches);
    } else {
      closeAutocomplete();
    }

    // Proactive matching: check if exact food is typed to suggest standard portions immediately
    const exactMatch = COMMON_FOODS.find(f => f.name.toLowerCase() === query);
    if (exactMatch) {
      renderPortionChips(exactMatch);
    }
  });

  // Handle keys inside autocomplete
  foodInput.addEventListener("keydown", (e) => {
    const items = autocompleteList.querySelectorAll(".autocomplete-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeAutocompleteIndex = (activeAutocompleteIndex + 1) % items.length;
      highlightAutocompleteItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeAutocompleteIndex = (activeAutocompleteIndex - 1 + items.length) % items.length;
      highlightAutocompleteItem(items);
    } else if (e.key === "Enter") {
      if (activeAutocompleteIndex > -1) {
        e.preventDefault();
        items[activeAutocompleteIndex].click();
      }
    } else if (e.key === "Escape") {
      closeAutocomplete();
    }
  });

  function highlightAutocompleteItem(items) {
    items.forEach((item, index) => {
      if (index === activeAutocompleteIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  function renderAutocomplete(matches) {
    autocompleteList.innerHTML = "";
    activeAutocompleteIndex = -1;

    matches.forEach(match => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.innerHTML = `
        <span class="autocomplete-food-name">${match.name}</span>
        <span class="autocomplete-food-detail">${match.serving} &bull; ${match.calories} kcal</span>
      `;

      item.addEventListener("click", () => {
        foodInput.value = match.name;
        portionInput.value = match.serving;
        clearInputBtn.style.display = "flex";
        closeAutocomplete();
        
        // Render dynamic quantity suggestions
        renderPortionChips(match);
      });

      autocompleteList.appendChild(item);
    });

    autocompleteList.style.display = "block";
  }

  function closeAutocomplete() {
    autocompleteList.innerHTML = "";
    autocompleteList.style.display = "none";
    activeAutocompleteIndex = -1;
  }

  // Close autocomplete if click is outside search wrapper
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-relative")) {
      closeAutocomplete();
    }
  });

  clearInputBtn.addEventListener("click", () => {
    foodInput.value = "";
    portionInput.value = "1 serving";
    clearInputBtn.style.display = "none";
    closeAutocomplete();
    hidePortionChips();
    foodInput.focus();
  });

  // --- PORTION SUGGESTION CHIPS LOGIC ---
  function renderPortionChips(foodItem) {
    if (!foodItem.suggestions || foodItem.suggestions.length === 0) {
      hidePortionChips();
      return;
    }

    portionChips.innerHTML = "";
    
    foodItem.suggestions.forEach(suggestion => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "portion-chip";
      if (portionInput.value === suggestion) {
        chip.classList.add("active");
      }
      chip.textContent = suggestion;

      chip.addEventListener("click", () => {
        portionInput.value = suggestion;
        portionChips.querySelectorAll(".portion-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      });

      portionChips.appendChild(chip);
    });

    portionChipsContainer.style.display = "flex";
  }

  function hidePortionChips() {
    portionChips.innerHTML = "";
    portionChipsContainer.style.display = "none";
  }

  // Monitor custom typing inside portionInput to reflect in chips
  portionInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    portionChips.querySelectorAll(".portion-chip").forEach(chip => {
      if (chip.textContent === val) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  });

  // --- DASHBOARD RENDERER ---
  function updateDashboard() {
    // 1. Calculate calorie progress
    const eaten = state.loggedMeals.reduce((acc, meal) => acc + meal.calories, 0);
    const remaining = state.dailyGoal - eaten;

    // Display numbers
    caloriesEatenText.textContent = Math.round(eaten).toLocaleString();
    caloriesGoalText.textContent = state.dailyGoal.toLocaleString();
    
    if (remaining < 0) {
      caloriesRemainingVal.textContent = Math.abs(Math.round(remaining)).toLocaleString();
      caloriesRemainingVal.classList.add("negative-balance");
      caloriesSubtext.textContent = "kcal over";
    } else {
      caloriesRemainingVal.textContent = Math.round(remaining).toLocaleString();
      caloriesRemainingVal.classList.remove("negative-balance");
      caloriesSubtext.textContent = "kcal left";
    }

    // Update Progress Ring SVG
    if (progressRingBar) {
      const radius = progressRingBar.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;
      progressRingBar.style.strokeDasharray = `${circumference} ${circumference}`;
      
      const percentage = state.dailyGoal > 0 ? Math.min(Math.max(eaten / state.dailyGoal, 0), 1) : 0;
      progressRingBar.style.strokeDashoffset = circumference - (percentage * circumference);
    }

    // 2. Determine Ratios based on Diet Preset
    let ratios;
    if (state.dietPreset === "custom") {
      ratios = state.customRatios;
      activePresetBadge.textContent = "Custom Profile";
    } else {
      ratios = DIET_PRESETS[state.dietPreset] || DIET_PRESETS.balanced;
      activePresetBadge.textContent = state.dietPreset.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    // Calorie allocations to grams
    // Protein (4 kcal/g), Carbs (4 kcal/g), Fats (9 kcal/g)
    const goalP = Math.round((state.dailyGoal * (ratios.protein / 100)) / 4);
    const goalC = Math.round((state.dailyGoal * (ratios.carbs / 100)) / 4);
    const goalF = Math.round((state.dailyGoal * (ratios.fat / 100)) / 9);

    proteinGoal.textContent = goalP;
    carbsGoal.textContent = goalC;
    fatGoal.textContent = goalF;

    // Current totals
    const curP = state.loggedMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    const curC = state.loggedMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
    const curF = state.loggedMeals.reduce((acc, m) => acc + (m.fat || 0), 0);

    proteinCurrent.textContent = Math.round(curP);
    carbsCurrent.textContent = Math.round(curC);
    fatCurrent.textContent = Math.round(curF);

    // Progress bar fills
    const fillP = goalP > 0 ? Math.min((curP / goalP) * 100, 100) : 0;
    const fillC = goalC > 0 ? Math.min((curC / goalC) * 100, 100) : 0;
    const fillF = goalF > 0 ? Math.min((curF / goalF) * 100, 100) : 0;

    proteinBar.style.width = `${fillP}%`;
    carbsBar.style.width = `${fillC}%`;
    fatBar.style.width = `${fillF}%`;

    // 3. Render food journal logs
    renderJournal();
  }

  // Render food journal items in flat chronological log
  function renderJournal() {
    if (state.loggedMeals.length === 0) {
      emptyJournalState.style.display = "flex";
      journalList.style.display = "none";
      return;
    }

    emptyJournalState.style.display = "none";
    journalList.style.display = "flex";
    journalList.innerHTML = "";

    state.loggedMeals.forEach(meal => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "journal-item";
      
      let timeStr = "";
      if (meal.timestamp) {
        try {
          const date = new Date(meal.timestamp);
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch(e) {}
      }

      itemDiv.innerHTML = `
        <div class="item-left">
          <span class="item-name">${meal.name}</span>
          <span class="item-serving">${meal.portion} ${timeStr ? `&bull; ${timeStr}` : ''}</span>
          <div class="item-macros-micro">
            <span>P: ${Math.round(meal.protein)}g</span>
            <span>C: ${Math.round(meal.carbs)}g</span>
            <span>F: ${Math.round(meal.fat)}g</span>
          </div>
        </div>
        <div class="item-right">
          <div class="item-calories">
            <span class="item-calories-value">${Math.round(meal.calories)}</span>
            <span class="item-calories-label">kcal</span>
          </div>
          <!-- Clone button -->
          <button class="btn-clone-item" data-id="${meal.id}" title="Duplicate this log">
            <i class="fa-solid fa-copy"></i>
          </button>
          <button class="btn-delete-item" data-id="${meal.id}" title="Remove entry">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      // Handle item clone
      itemDiv.querySelector(".btn-clone-item").addEventListener("click", (e) => {
        const idToClone = e.currentTarget.getAttribute("data-id");
        cloneLoggedMeal(idToClone);
      });

      // Handle item deletion
      itemDiv.querySelector(".btn-delete-item").addEventListener("click", (e) => {
        const idToDelete = e.currentTarget.getAttribute("data-id");
        deleteLoggedMeal(idToDelete);
      });

      journalList.appendChild(itemDiv);
    });
  }

  function cloneLoggedMeal(id) {
    const mealToClone = state.loggedMeals.find(m => m.id === id);
    if (!mealToClone) return;

    const clonedMeal = {
      ...mealToClone,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString()
    };

    state.loggedMeals.unshift(clonedMeal);
    saveState();
    updateDashboard();
    showToast(`Duplicated ${clonedMeal.name}!`, "success");
  }

  function deleteLoggedMeal(id) {
    state.loggedMeals = state.loggedMeals.filter(meal => meal.id !== id);
    saveState();
    updateDashboard();
    showToast("Journal entry removed.", "info");
  }

  clearAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your daily journal?")) {
      state.loggedMeals = [];
      saveState();
      updateDashboard();
      showToast("Cleared today's journal.", "info");
    }
  });

  // --- OPENROUTER API CLIENT ---
  async function queryOpenRouterCalorie(foodName, portionSize) {
    if (!state.apiKey) {
      throw new Error("No API key configured. Please input an OpenRouter API key in settings.");
    }

    const payload = {
      model: state.selectedModel,
      messages: [
        {
          role: "system",
          content: `You are an expert nutritionist AI. Your task is to calculate the nutritional information for the food entered.
You must respond with ONLY a valid, single JSON block, without code fences (like \`\`\`json) or extra text.
The JSON must have this exact shape:
{
  "foodName": "Normalized name of food",
  "portionAnalyzed": "Brief serving size description (e.g. 150g, 1 slice)",
  "calories": 150,
  "protein": 5.5,
  "carbs": 24.2,
  "fat": 4.1
}
Only output raw JSON. Estimate based on standard nutritional profiles if the portion size is slightly generic.`
        },
        {
          role: "user",
          content: `Analyze this food: "${foodName}", portion: "${portionSize}".`
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${state.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/antigravity-ai",
        "X-Title": "GlowCal Calories Calculator"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (HTTP ${response.status}): ${errText || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Invalid response format received from OpenRouter API.");
    }

    let resultText = data.choices[0].message.content.trim();
    resultText = resultText.replace(/^\s*```(json)?/i, "").replace(/```\s*$/, "").trim();

    try {
      const parsedData = JSON.parse(resultText);
      
      // Basic schema validations
      if (typeof parsedData.calories !== "number") {
        parsedData.calories = parseFloat(parsedData.calories) || 0;
      }
      if (typeof parsedData.protein !== "number") {
        parsedData.protein = parseFloat(parsedData.protein) || 0;
      }
      if (typeof parsedData.carbs !== "number") {
        parsedData.carbs = parseFloat(parsedData.carbs) || 0;
      }
      if (typeof parsedData.fat !== "number") {
        parsedData.fat = parseFloat(parsedData.fat) || 0;
      }

      return parsedData;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", resultText);
      throw new Error("Could not parse nutrition data structure. LLM returned malformed content.");
    }
  }

  // Fallback to local estimation if offline or API key fails
  function performLocalFallbackEstimation(foodName, portionSize) {
    const query = foodName.toLowerCase();
    
    // Look for best substring match in COMMON_FOODS
    let matchedFood = COMMON_FOODS.find(food => query.includes(food.name.toLowerCase()) || food.name.toLowerCase().includes(query));
    
    // Default fallback values if nothing matches
    if (!matchedFood) {
      matchedFood = { name: foodName, calories: 150, protein: 4, carbs: 20, fat: 3, serving: "1 serving" };
    }

    // Try to parse quantity to scale estimates
    let scale = 1.0;
    const numberPattern = /(\d+(\.\d+)?)/;
    const matchVal = portionSize.match(numberPattern);
    if (matchVal) {
      const quantityParsed = parseFloat(matchVal[1]);
      if (quantityParsed > 0 && quantityParsed <= 20) {
        scale = quantityParsed;
      } else if (quantityParsed > 20) {
        const matchedGramsMatch = matchedFood.serving.match(/(\d+)g/);
        if (matchedGramsMatch) {
          const baselineGrams = parseFloat(matchedGramsMatch[1]);
          scale = quantityParsed / baselineGrams;
        } else {
          scale = quantityParsed / 100;
        }
      }
    }

    return {
      foodName: matchedFood.name,
      portionAnalyzed: portionSize,
      calories: matchedFood.calories * scale,
      protein: matchedFood.protein * scale,
      carbs: matchedFood.carbs * scale,
      fat: matchedFood.fat * scale,
      isFallback: true
    };
  }

  // --- FORM SUBMIT EVENT ---
  foodForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const foodName = foodInput.value.trim();
    const portionSize = portionInput.value.trim();

    if (!foodName || !portionSize) return;

    setLoading(true);

    try {
      let nutritionResult;
      
      if (!state.apiKey) {
        showToast("No API Key detected. Estimating locally...", "info");
        nutritionResult = performLocalFallbackEstimation(foodName, portionSize);
      } else {
        try {
          nutritionResult = await queryOpenRouterCalorie(foodName, portionSize);
        } catch (apiError) {
          console.warn("OpenRouter API Failed, falling back to local database...", apiError);
          showToast("API Query failed. Using database fallback.", "warning");
          nutritionResult = performLocalFallbackEstimation(foodName, portionSize);
        }
      }

      // Add to logged meals
      const newMeal = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: nutritionResult.foodName || foodName,
        portion: nutritionResult.portionAnalyzed || portionSize,
        calories: nutritionResult.calories,
        protein: nutritionResult.protein,
        carbs: nutritionResult.carbs,
        fat: nutritionResult.fat,
        timestamp: new Date().toISOString()
      };

      state.loggedMeals.unshift(newMeal);
      saveState();
      updateDashboard();

      // Clear search
      foodInput.value = "";
      portionInput.value = "1 serving";
      clearInputBtn.style.display = "none";
      hidePortionChips();
      
      showToast(`Added ${newMeal.name} (+${Math.round(newMeal.calories)} kcal)`, "success");

    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      submitFoodBtn.disabled = true;
      foodInput.disabled = true;
      portionInput.disabled = true;
      btnText.style.display = "none";
      btnSpinner.style.display = "block";
    } else {
      submitFoodBtn.disabled = false;
      foodInput.disabled = false;
      portionInput.disabled = false;
      btnText.style.display = "block";
      btnSpinner.style.display = "none";
    }
  }

  // --- TOAST SYSTEM ---
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconClass = "fa-info-circle toast-icon-info";
    if (type === "success") iconClass = "fa-check-circle toast-icon-success";
    if (type === "error") iconClass = "fa-times-circle toast-icon-error";
    if (type === "warning") iconClass = "fa-exclamation-triangle toast-icon-error";

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Animate out
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }
});
