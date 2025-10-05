// ------------------------- Index Page -------------------------
if (document.body.classList.contains("index-page")) {
  const searchBtn = document.getElementById("searchBtn");
  const ingredientsInput = document.getElementById("ingredientsInput");

  searchBtn.addEventListener("click", () => {
    const ingredients = ingredientsInput.value.trim();
    if (!ingredients) {
      alert("Please enter at least one main ingredient.");
      return;
    }
    window.location.href = `recipes.html?ingredients=${encodeURIComponent(ingredients)}`;
  });

  ingredientsInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });
}

// ------------------------- Recipes Page -------------------------
if (document.body.classList.contains("recipes-page")) {
  const recipesContainer = document.getElementById("recipesContainer");
  const goBackBtn = document.getElementById("goBack");

  // Back to index page
  goBackBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Get ingredients from query string
  const urlParams = new URLSearchParams(window.location.search);
  const ingredients = urlParams.get("ingredients");

  if (!ingredients) {
    recipesContainer.innerHTML = "<p>No ingredients provided.</p>";
  } else {
    fetchRecipes(ingredients.split(",").map(i => i.trim()));
  }

  async function fetchRecipes(ingredientsArray) {
    try {
      // Display simple loading text
      recipesContainer.innerHTML = `<p class="loading-message">Finding recipes… please wait 🍳</p>`;

      const fetches = ingredientsArray.map(ing =>
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ing}`).then(res => res.json())
      );
      const results = await Promise.all(fetches);

      let meals = [];
      results.forEach(r => {
        if (r.meals) meals = meals.concat(r.meals);
      });

      const uniqueMeals = [...new Map(meals.map(item => [item.idMeal, item])).values()];

      if (uniqueMeals.length === 0) {
        recipesContainer.innerHTML = "<p>No recipes found for these ingredients.</p>";
        return;
      }

      displayMeals(uniqueMeals);
    } catch (error) {
      console.error(error);
      recipesContainer.innerHTML = "<p>Error fetching recipes. Please try again later.</p>";
    }
  }

  function displayMeals(meals) {
    recipesContainer.innerHTML = ""; // clear message
    meals.forEach(meal => {
      const mealCard = document.createElement("div");
      mealCard.classList.add("meal-card");

      mealCard.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <h2>${meal.strMeal}</h2>
        <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
        <div class="meal-details"></div>
      `;

      recipesContainer.appendChild(mealCard);

      const btn = mealCard.querySelector(".view-recipe");
      const detailsDiv = mealCard.querySelector(".meal-details");

      btn.addEventListener("click", async () => {
        // Hide all other cards
        Array.from(recipesContainer.children).forEach(c => {
          if (c !== mealCard) c.style.display = "none";
        });
        mealCard.classList.add("fullscreen");

        if (detailsDiv.innerHTML === "") {
          // Show simple loading text inside the card
          detailsDiv.innerHTML = `<p class="loading-message">Loading recipe details… please wait 🍳</p>`;

          const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
          const data = await res.json();
          const fullMeal = data.meals[0];

          let ingredientsList = "<ul>";
          for (let i = 1; i <= 20; i++) {
            const ingredient = fullMeal[`strIngredient${i}`];
            const measure = fullMeal[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== "") {
              ingredientsList += `<li>${ingredient} - ${measure}</li>`;
            }
          }
          ingredientsList += "</ul>";

          const instructions = `<p>${fullMeal.strInstructions}</p>`;

          detailsDiv.innerHTML = `
            <h3>Ingredients:</h3>
            ${ingredientsList}
            <h3>Instructions:</h3>
            ${instructions}
          `;
        }

        detailsDiv.style.display = "block";
        btn.style.display = "none";
      });
    });
  }
}

