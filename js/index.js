/**
 * Recipe Finder Pro - Professional Recipe Discovery Application
 * 
 * This application provides a modern, responsive interface for discovering
 * recipes from around the world using TheMealDB API.
 * 
 * Features:
 * - Modern ES6+ JavaScript with modular architecture
 * - Comprehensive error handling and loading states
 * - Performance optimizations with debouncing and caching
 * - Accessibility features and keyboard navigation
 * - Responsive design with mobile-first approach
 * - Professional UI/UX with smooth animations
 * 
 * @author Senior Frontend Developer
 * @version 2.0.0
 * @license MIT
 */

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

const CONFIG = {
    API_BASE_URL: 'https://www.themealdb.com/api/json/v1/1',
    DEBOUNCE_DELAY: 300,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_RECIPES_PER_PAGE: 12,
    ANIMATION_DURATION: 300
};

const API_ENDPOINTS = {
    SEARCH_BY_NAME: `${CONFIG.API_BASE_URL}/search.php?s=`,
    SEARCH_BY_FIRST_LETTER: `${CONFIG.API_BASE_URL}/search.php?f=`,
    CATEGORIES: `${CONFIG.API_BASE_URL}/categories.php`,
    AREAS: `${CONFIG.API_BASE_URL}/list.php?a=list`,
    INGREDIENTS: `${CONFIG.API_BASE_URL}/list.php?i=list`,
    FILTER_BY_INGREDIENT: `${CONFIG.API_BASE_URL}/filter.php?i=`,
    FILTER_BY_CATEGORY: `${CONFIG.API_BASE_URL}/filter.php?c=`,
    FILTER_BY_AREA: `${CONFIG.API_BASE_URL}/filter.php?a=`,
    LOOKUP_BY_ID: `${CONFIG.API_BASE_URL}/lookup.php?i=`,
    RANDOM: `${CONFIG.API_BASE_URL}/random.php`,
    RANDOM_SELECTION: `${CONFIG.API_BASE_URL}/randomselection.php`,
    LATEST_MEALS: `${CONFIG.API_BASE_URL}/latest.php`
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Simple cache implementation
 */
class Cache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttl = CONFIG.CACHE_DURATION) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorElement.style.display = 'block';
    hideLoading();
}

/**
 * Show no results message
 */
function showNoResults() {
    document.getElementById('noResults').style.display = 'block';
    hideLoading();
}

    /**
     * Update page title and subtitle
     * @param {string} title - Page title
     * @param {string} subtitle - Page subtitle
     */
    function updatePageHeader(title, subtitle) {
        document.getElementById('pageTitle').textContent = title;
        document.getElementById('pageSubtitle').textContent = subtitle;
    }

    /**
     * Update breadcrumb navigation
     * @param {string} currentPage - Current page name
     * @param {boolean} showBreadcrumb - Whether to show breadcrumb
     */
    function updateBreadcrumb(currentPage, showBreadcrumb = false) {
        const breadcrumb = document.getElementById('breadcrumb');
        const currentBreadcrumb = document.getElementById('currentBreadcrumb');
        
        if (showBreadcrumb && currentPage) {
            breadcrumb.style.display = 'block';
            currentBreadcrumb.textContent = currentPage;
        } else {
            breadcrumb.style.display = 'none';
        }
    }

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================================
// API SERVICE
// ========================================

class RecipeAPI {
    constructor() {
        this.cache = new Cache();
    }

    /**
     * Make API request with error handling
     * @param {string} url - API endpoint
     * @returns {Promise<Object>} API response
     */
    async makeRequest(url) {
        try {
            // Check cache first
            const cached = this.cache.get(url);
            if (cached) return cached;

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            this.cache.set(url, data);
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
    }

    /**
     * Search recipes by name
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of recipes
     */
    async searchByName(query) {
        if (!query.trim()) return [];
        
        const url = `${API_ENDPOINTS.SEARCH_BY_NAME}${encodeURIComponent(query)}`;
        const data = await this.makeRequest(url);
        return data.meals || [];
    }

    /**
     * Search recipes by first letter
     * @param {string} letter - First letter
     * @returns {Promise<Array>} Array of recipes
     */
    async searchByLetter(letter) {
        if (!letter || letter.length !== 1) return [];
        
        const url = `${API_ENDPOINTS.SEARCH_BY_FIRST_LETTER}${letter.toUpperCase()}`;
        const data = await this.makeRequest(url);
        return data.meals || [];
    }

    /**
     * Get all categories
     * @returns {Promise<Array>} Array of categories
     */
    async getCategories() {
        const data = await this.makeRequest(API_ENDPOINTS.CATEGORIES);
        return data.categories || [];
    }

    /**
     * Get all areas
     * @returns {Promise<Array>} Array of areas
     */
    async getAreas() {
        const data = await this.makeRequest(API_ENDPOINTS.AREAS);
        return data.meals || [];
    }

    /**
     * Get all ingredients
     * @returns {Promise<Array>} Array of ingredients
     */
    async getIngredients() {
        const data = await this.makeRequest(API_ENDPOINTS.INGREDIENTS);
        return data.meals || [];
    }

    /**
     * Get recipes by ingredient
     * @param {string} ingredient - Ingredient name
     * @returns {Promise<Array>} Array of recipes
     */
    async getRecipesByIngredient(ingredient) {
        const url = `${API_ENDPOINTS.FILTER_BY_INGREDIENT}${encodeURIComponent(ingredient)}`;
        const data = await this.makeRequest(url);
        return data.meals || [];
    }

    /**
     * Get random recipe
     * @returns {Promise<Object>} Random recipe
     */
    async getRandomRecipe() {
        const data = await this.makeRequest(API_ENDPOINTS.RANDOM);
        return data.meals?.[0] || null;
    }

    /**
     * Get random selection of recipes (Premium feature)
     * @returns {Promise<Array>} Array of random recipes
     */
    async getRandomSelection() {
        try {
            const data = await this.makeRequest(API_ENDPOINTS.RANDOM_SELECTION);
            return data.meals || [];
        } catch (error) {
            console.warn('Random selection not available, falling back to single random recipe');
            const randomRecipe = await this.getRandomRecipe();
            return randomRecipe ? [randomRecipe] : [];
        }
    }

    /**
     * Get latest meals (Premium feature)
     * @returns {Promise<Array>} Array of latest meals
     */
    async getLatestMeals() {
        try {
            const data = await this.makeRequest(API_ENDPOINTS.LATEST_MEALS);
            return data.meals || [];
        } catch (error) {
            console.warn('Latest meals not available');
            return [];
        }
    }

    /**
     * Get recipe by ID
     * @param {string} id - Recipe ID
     * @returns {Promise<Object>} Recipe object
     */
    async getRecipeById(id) {
        const url = `${API_ENDPOINTS.LOOKUP_BY_ID}${id}`;
        const data = await this.makeRequest(url);
        return data.meals?.[0] || null;
    }

    /**
     * Get recipes by category
     * @param {string} category - Category name
     * @returns {Promise<Array>} Array of recipes
     */
    async getRecipesByCategory(category) {
        const url = `${API_ENDPOINTS.FILTER_BY_CATEGORY}${encodeURIComponent(category)}`;
        const data = await this.makeRequest(url);
        return data.meals || [];
    }

    /**
     * Get recipes by area
     * @param {string} area - Area name
     * @returns {Promise<Array>} Array of recipes
     */
    async getRecipesByArea(area) {
        const url = `${API_ENDPOINTS.FILTER_BY_AREA}${encodeURIComponent(area)}`;
        const data = await this.makeRequest(url);
        return data.meals || [];
    }

    /**
     * Get full recipe details for multiple recipes
     * @param {Array} recipes - Array of recipe objects with idMeal
     * @returns {Promise<Array>} Array of detailed recipes
     */
    async getFullRecipeDetails(recipes) {
        const detailedRecipes = [];
        for (const recipe of recipes) {
            if (recipe.idMeal) {
                const detailedRecipe = await this.getRecipeById(recipe.idMeal);
                if (detailedRecipe) {
                    detailedRecipes.push(detailedRecipe);
                }
            }
        }
        return detailedRecipes;
    }
}

// ========================================
// UI COMPONENTS
// ========================================

class UIComponents {
    /**
     * Create recipe card HTML
     * @param {Object} recipe - Recipe object
     * @returns {string} Recipe card HTML
     */
    static createRecipeCard(recipe) {
        const title = sanitizeHTML(recipe.strMeal || 'Unknown Recipe');
        const image = recipe.strMealThumb || 'img/placeholder.jpg';
        const category = sanitizeHTML(recipe.strCategory || '');
        const area = sanitizeHTML(recipe.strArea || '');
        const isFavorite = this.isRecipeFavorite(recipe.idMeal);
        
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="recipe-card hover-lift" data-recipe-id="${recipe.idMeal}">
                    <div class="recipe-image">
                        <img src="${image}" alt="${title}" loading="lazy">
                        <div class="recipe-overlay">
                            <h3 class="recipe-title">${title}</h3>
                            <div class="recipe-actions">
                                <button class="btn btn-sm btn-primary view-recipe" data-recipe-id="${recipe.idMeal}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-sm ${isFavorite ? 'btn-danger' : 'btn-outline-danger'} favorite-btn" data-recipe-id="${recipe.idMeal}">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="recipe-content">
                        ${category ? `<div class="recipe-category">${category}</div>` : ''}
                        ${area ? `<div class="recipe-area">${area}</div>` : ''}
                        <div class="recipe-meta">
                            <small class="text-muted">ID: ${recipe.idMeal}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Check if recipe is in favorites
     * @param {string} recipeId - Recipe ID
     * @returns {boolean} True if recipe is favorite
     */
    static isRecipeFavorite(recipeId) {
        try {
            const favorites = JSON.parse(localStorage.getItem('recipeFavorites') || '[]');
            return favorites.some(fav => fav.idMeal === recipeId);
        } catch (error) {
            return false;
        }
    }

    /**
     * Create category card HTML
     * @param {Object} category - Category object
     * @returns {string} Category card HTML
     */
    static createCategoryCard(category) {
        const name = sanitizeHTML(category.strCategory || '');
        const description = sanitizeHTML(category.strCategoryDescription || '');
        const image = category.strCategoryThumb || 'img/placeholder.jpg';
        
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="recipe-card hover-lift" data-category="${name}">
                    <div class="recipe-image">
                        <img src="${image}" alt="${name}" loading="lazy">
                        <div class="recipe-overlay">
                            <h3 class="recipe-title">${name}</h3>
                        </div>
                    </div>
                    <div class="recipe-content">
                        <p class="recipe-description">${description}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create area card HTML
     * @param {Object} area - Area object
     * @returns {string} Area card HTML
     */
    static createAreaCard(area) {
        const name = sanitizeHTML(area.strArea || '');
        
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="recipe-card hover-lift" data-area="${name}">
                    <div class="recipe-image">
                        <div class="area-icon">
                            <i class="fas fa-globe fa-3x"></i>
                        </div>
                        <div class="recipe-overlay">
                            <h3 class="recipe-title">${name}</h3>
                        </div>
                    </div>
                    <div class="recipe-content">
                        <div class="recipe-category">Cuisine Area</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create ingredient card HTML
     * @param {Object} ingredient - Ingredient object
     * @returns {string} Ingredient card HTML
     */
    static createIngredientCard(ingredient) {
        const name = sanitizeHTML(ingredient.strIngredient || '');
        const description = sanitizeHTML(ingredient.strDescription || '');
        
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="recipe-card hover-lift" data-ingredient="${name}">
                    <div class="recipe-image">
                        <div class="ingredient-icon">
                            <i class="fas fa-utensils fa-3x"></i>
                        </div>
                        <div class="recipe-overlay">
                            <h3 class="recipe-title">${name}</h3>
                        </div>
                    </div>
                    <div class="recipe-content">
                        <p class="recipe-description">${description}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create recipe modal content
     * @param {Object} recipe - Recipe object
     * @returns {string} Modal content HTML
     */
    static createRecipeModalContent(recipe) {
        const title = sanitizeHTML(recipe.strMeal || '');
        const image = recipe.strMealThumb || '';
        const instructions = sanitizeHTML(recipe.strInstructions || '');
        const category = sanitizeHTML(recipe.strCategory || '');
        const area = sanitizeHTML(recipe.strArea || '');
        const tags = recipe.strTags ? recipe.strTags.split(',').map(tag => tag.trim()) : [];
        const source = recipe.strSource || '';
        const youtube = recipe.strYoutube || '';

        // Generate ingredients list
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push({
                    ingredient: ingredient.trim(),
                    measure: measure ? measure.trim() : ''
                });
            }
        }

        return `
            <div class="recipe-details">
                <div class="recipe-image-large">
                    <img src="${image}" alt="${title}" class="img-fluid">
                </div>
                <div class="recipe-info">
                    <h3>${title}</h3>
                    ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
                    ${area ? `<p><strong>Area:</strong> ${area}</p>` : ''}
                    
                    <div class="recipe-instructions">
                        <h4>Instructions</h4>
                        <p>${instructions}</p>
                    </div>
                    
                    ${ingredients.length > 0 ? `
                        <div class="recipe-ingredients">
                            <h4>Ingredients</h4>
                            ${ingredients.map(item => `
                                <span class="ingredient-tag">
                                    ${item.measure} ${item.ingredient}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${tags.length > 0 ? `
                        <div class="recipe-tags">
                            <h4>Tags</h4>
                            ${tags.map(tag => `
                                <span class="tag">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// ========================================
// APPLICATION CLASS
// ========================================

class RecipeFinderApp {
    constructor() {
        this.api = new RecipeAPI();
        this.currentSection = 'home';
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupSidebar();
        this.loadInitialRecipes();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Search functionality
        const nameSearch = document.getElementById('nameSearch');
        const letterSearch = document.getElementById('letterSearch');
        const recipeIdSearch = document.getElementById('recipeIdSearch');

        if (nameSearch) {
            nameSearch.addEventListener('input', debounce((e) => {
                this.handleNameSearch(e.target.value);
            }, CONFIG.DEBOUNCE_DELAY));
        }

        if (letterSearch) {
            letterSearch.addEventListener('input', debounce((e) => {
                this.handleLetterSearch(e.target.value);
            }, CONFIG.DEBOUNCE_DELAY));
        }

        if (recipeIdSearch) {
            recipeIdSearch.addEventListener('input', debounce((e) => {
                this.handleRecipeIdSearch(e.target.value);
            }, CONFIG.DEBOUNCE_DELAY));
        }

        // Quick action buttons
        const randomRecipeBtn = document.getElementById('randomRecipeBtn');
        const randomSelectionBtn = document.getElementById('randomSelectionBtn');
        const latestRecipesBtn = document.getElementById('latestRecipesBtn');

        if (randomRecipeBtn) {
            randomRecipeBtn.addEventListener('click', () => {
                this.loadRandomRecipe();
            });
        }

        if (randomSelectionBtn) {
            randomSelectionBtn.addEventListener('click', () => {
                this.loadRandomSelection();
            });
        }

        if (latestRecipesBtn) {
            latestRecipesBtn.addEventListener('click', () => {
                this.loadLatestRecipes();
            });
        }

        // Recipe card interactions
        document.addEventListener('click', (e) => {
            // View recipe button
            if (e.target.closest('.view-recipe')) {
                e.preventDefault();
                e.stopPropagation();
                const recipeId = e.target.closest('.view-recipe').dataset.recipeId;
                if (recipeId) {
                    this.showRecipeDetails(recipeId);
                }
            }

            // Favorite button
            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const recipeId = e.target.closest('.favorite-btn').dataset.recipeId;
                if (recipeId) {
                    this.toggleFavorite(recipeId);
                }
            }

            // Recipe card click (fallback)
            const recipeCard = e.target.closest('.recipe-card');
            if (recipeCard && !e.target.closest('.recipe-actions')) {
                const recipeId = recipeCard.dataset.recipeId;
                if (recipeId) {
                    this.showRecipeDetails(recipeId);
                }
            }
        });

        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(e.target);
            });
        }

        // Breadcrumb navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('breadcrumb-link')) {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            }
        });
    }

    /**
     * Setup sidebar functionality
     */
    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
                    this.closeSidebar();
                }
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const menuIcon = document.getElementById('menuIcon');
        const closeIcon = document.getElementById('closeIcon');
        const toggleBtn = document.getElementById('sidebarToggle');

        if (sidebar.classList.contains('active')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * Open sidebar
     */
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const menuIcon = document.getElementById('menuIcon');
        const closeIcon = document.getElementById('closeIcon');
        const toggleBtn = document.getElementById('sidebarToggle');

        sidebar.classList.add('active');
        mainContent.classList.add('sidebar-open');
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'block';
        toggleBtn.setAttribute('aria-expanded', 'true');
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const menuIcon = document.getElementById('menuIcon');
        const closeIcon = document.getElementById('closeIcon');
        const toggleBtn = document.getElementById('sidebarToggle');

        sidebar.classList.remove('active');
        mainContent.classList.remove('sidebar-open');
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    /**
     * Navigate to different sections
     * @param {string} section - Section name
     */
    async navigateToSection(section) {
        this.currentSection = section;
        this.closeSidebar();
        this.updateActiveNavLink(section);

        switch (section) {
            case 'search':
                this.showSearchSection();
                break;
            case 'categories':
                await this.loadCategories();
                break;
            case 'areas':
                await this.loadAreas();
                break;
            case 'ingredients':
                await this.loadIngredients();
                break;
            case 'random':
                await this.loadRandomRecipe();
                break;
            case 'latest':
                await this.loadLatestRecipes();
                break;
            case 'favorites':
                this.showFavorites();
                break;
            case 'contact':
                this.showContactSection();
                break;
            default:
                await this.loadInitialRecipes();
        }
    }

    /**
     * Update active navigation link
     * @param {string} section - Active section
     */
    updateActiveNavLink(section) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Show search section
     */
    showSearchSection() {
        updatePageHeader('Search Recipes', 'Find your perfect recipe by name or first letter');
        updateBreadcrumb('Search', true);
        document.getElementById('searchSection').style.display = 'block';
        document.getElementById('resultsContainer').innerHTML = '';
    }

    /**
     * Show contact section
     */
    showContactSection() {
        updatePageHeader('Contact Us', 'Get in touch with our culinary experts');
        updateBreadcrumb('Contact', true);
        document.getElementById('searchSection').style.display = 'none';
        
        const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
        contactModal.show();
    }

    /**
     * Load initial recipes
     */
    async loadInitialRecipes() {
        try {
            showLoading();
            updatePageHeader('Recipe Finder Pro', 'Discover culinary excellence from around the world');
            updateBreadcrumb('', false);
            document.getElementById('searchSection').style.display = 'none';

            const recipes = await this.api.searchByName('');
            this.displayRecipes(recipes);
        } catch (error) {
            showError('Failed to load recipes. Please try again later.');
        }
    }

    /**
     * Handle name search
     * @param {string} query - Search query
     */
    async handleNameSearch(query) {
        try {
            if (!query.trim()) {
                await this.loadInitialRecipes();
                return;
            }

            showLoading();
            const recipes = await this.api.searchByName(query);
            this.displayRecipes(recipes);
        } catch (error) {
            showError('Search failed. Please try again.');
        }
    }

    /**
     * Handle letter search
     * @param {string} letter - First letter
     */
    async handleLetterSearch(letter) {
        try {
            if (!letter || letter.length !== 1) {
                await this.loadInitialRecipes();
                return;
            }

            showLoading();
            const recipes = await this.api.searchByLetter(letter);
            this.displayRecipes(recipes);
        } catch (error) {
            showError('Search failed. Please try again.');
        }
    }

    /**
     * Handle recipe ID search
     * @param {string} id - Recipe ID
     */
    async handleRecipeIdSearch(id) {
        try {
            if (!id || id.trim() === '') {
                await this.loadInitialRecipes();
                return;
            }

            showLoading();
            const recipe = await this.api.getRecipeById(id);
            if (recipe) {
                this.displayRecipes([recipe]);
            } else {
                showNoResults();
            }
        } catch (error) {
            showError('Recipe not found. Please check the ID and try again.');
        }
    }

    /**
     * Load random recipe
     */
    async loadRandomRecipe() {
        try {
            showLoading();
            updatePageHeader('Random Recipe', 'Discover something new and exciting');
            document.getElementById('searchSection').style.display = 'none';

            const recipe = await this.api.getRandomRecipe();
            if (recipe) {
                this.displayRecipes([recipe]);
            } else {
                showError('Failed to load random recipe. Please try again.');
            }
        } catch (error) {
            showError('Failed to load random recipe. Please try again.');
        }
    }

    /**
     * Load random selection of recipes
     */
    async loadRandomSelection() {
        try {
            showLoading();
            updatePageHeader('Random Selection', 'A curated selection of random recipes');
            document.getElementById('searchSection').style.display = 'none';

            const recipes = await this.api.getRandomSelection();
            this.displayRecipes(recipes);
        } catch (error) {
            showError('Failed to load random selection. Please try again.');
        }
    }

    /**
     * Load latest recipes
     */
    async loadLatestRecipes() {
        try {
            showLoading();
            updatePageHeader('Latest Recipes', 'The newest additions to our collection');
            document.getElementById('searchSection').style.display = 'none';

            const recipes = await this.api.getLatestMeals();
            this.displayRecipes(recipes);
        } catch (error) {
            showError('Failed to load latest recipes. Please try again.');
        }
    }

    /**
     * Show favorites section
     */
    showFavorites() {
        updatePageHeader('Favorite Recipes', 'Your saved recipes');
        document.getElementById('searchSection').style.display = 'none';
        
        const favorites = this.getFavorites();
        if (favorites.length > 0) {
            this.displayRecipes(favorites);
        } else {
            showNoResults();
        }
    }

    /**
     * Get favorites from localStorage
     * @returns {Array} Array of favorite recipes
     */
    getFavorites() {
        try {
            const favorites = localStorage.getItem('recipeFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    /**
     * Add recipe to favorites
     * @param {Object} recipe - Recipe object
     */
    addToFavorites(recipe) {
        try {
            const favorites = this.getFavorites();
            const exists = favorites.find(fav => fav.idMeal === recipe.idMeal);
            
            if (!exists) {
                favorites.push(recipe);
                localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
                this.showToast('Recipe added to favorites!', 'success');
            } else {
                this.showToast('Recipe already in favorites!', 'info');
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            this.showToast('Failed to add to favorites', 'error');
        }
    }

    /**
     * Remove recipe from favorites
     * @param {string} recipeId - Recipe ID
     */
    removeFromFavorites(recipeId) {
        try {
            const favorites = this.getFavorites();
            const updatedFavorites = favorites.filter(fav => fav.idMeal !== recipeId);
            localStorage.setItem('recipeFavorites', JSON.stringify(updatedFavorites));
            this.showToast('Recipe removed from favorites!', 'success');
        } catch (error) {
            console.error('Error removing from favorites:', error);
            this.showToast('Failed to remove from favorites', 'error');
        }
    }

    /**
     * Toggle favorite status for a recipe
     * @param {string} recipeId - Recipe ID
     */
    async toggleFavorite(recipeId) {
        try {
            const favorites = this.getFavorites();
            const exists = favorites.find(fav => fav.idMeal === recipeId);
            
            if (exists) {
                this.removeFromFavorites(recipeId);
                this.updateFavoriteButton(recipeId, false);
            } else {
                // Get full recipe details
                const recipe = await this.api.getRecipeById(recipeId);
                if (recipe) {
                    this.addToFavorites(recipe);
                    this.updateFavoriteButton(recipeId, true);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showToast('Failed to update favorite', 'error');
        }
    }

    /**
     * Update favorite button appearance
     * @param {string} recipeId - Recipe ID
     * @param {boolean} isFavorite - Whether recipe is favorite
     */
    updateFavoriteButton(recipeId, isFavorite) {
        const buttons = document.querySelectorAll(`[data-recipe-id="${recipeId}"].favorite-btn`);
        buttons.forEach(button => {
            if (isFavorite) {
                button.classList.remove('btn-outline-danger');
                button.classList.add('btn-danger');
            } else {
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-danger');
            }
        });
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Load categories
     */
    async loadCategories() {
        try {
            showLoading();
            updatePageHeader('Recipe Categories', 'Browse recipes by category');
            document.getElementById('searchSection').style.display = 'none';

            const categories = await this.api.getCategories();
            this.displayCategories(categories);
        } catch (error) {
            showError('Failed to load categories. Please try again later.');
        }
    }

    /**
     * Load areas
     */
    async loadAreas() {
        try {
            showLoading();
            updatePageHeader('Cuisine Areas', 'Explore recipes from different regions');
            document.getElementById('searchSection').style.display = 'none';

            const areas = await this.api.getAreas();
            this.displayAreas(areas);
        } catch (error) {
            showError('Failed to load areas. Please try again later.');
        }
    }

    /**
     * Load ingredients
     */
    async loadIngredients() {
        try {
            showLoading();
            updatePageHeader('Ingredients', 'Find recipes by ingredient');
            document.getElementById('searchSection').style.display = 'none';

            const ingredients = await this.api.getIngredients();
            this.displayIngredients(ingredients);
        } catch (error) {
            showError('Failed to load ingredients. Please try again later.');
        }
    }

    /**
     * Display recipes in grid
     * @param {Array} recipes - Array of recipes
     */
    displayRecipes(recipes) {
        const container = document.getElementById('resultsGrid');
        
        if (!recipes || recipes.length === 0) {
            showNoResults();
            return;
        }

        const html = recipes.map(recipe => UIComponents.createRecipeCard(recipe)).join('');
        container.innerHTML = html;
        hideLoading();
    }

    /**
     * Display categories in grid
     * @param {Array} categories - Array of categories
     */
    displayCategories(categories) {
        const container = document.getElementById('resultsGrid');
        
        if (!categories || categories.length === 0) {
            showNoResults();
            return;
        }

        const html = categories.map(category => UIComponents.createCategoryCard(category)).join('');
        container.innerHTML = html;
        hideLoading();

        // Add click handlers for category cards
        document.querySelectorAll('[data-category]').forEach(card => {
            card.addEventListener('click', async (e) => {
                const category = e.currentTarget.dataset.category;
                await this.loadRecipesByCategory(category);
            });
        });
    }

    /**
     * Load recipes by category
     * @param {string} category - Category name
     */
    async loadRecipesByCategory(category) {
        try {
            showLoading();
            updatePageHeader(`${category} Recipes`, `Discover delicious ${category.toLowerCase()} recipes`);
            document.getElementById('searchSection').style.display = 'none';

            const recipes = await this.api.getRecipesByCategory(category);
            if (recipes.length > 0) {
                // Get full recipe details for better display
                const detailedRecipes = await this.api.getFullRecipeDetails(recipes);
                this.displayRecipes(detailedRecipes);
            } else {
                showNoResults();
            }
        } catch (error) {
            showError('Failed to load category recipes. Please try again.');
        }
    }

    /**
     * Display areas in grid
     * @param {Array} areas - Array of areas
     */
    displayAreas(areas) {
        const container = document.getElementById('resultsGrid');
        
        if (!areas || areas.length === 0) {
            showNoResults();
            return;
        }

        const html = areas.map(area => UIComponents.createAreaCard(area)).join('');
        container.innerHTML = html;
        hideLoading();

        // Add click handlers for area cards
        document.querySelectorAll('[data-area]').forEach(card => {
            card.addEventListener('click', async (e) => {
                const area = e.currentTarget.dataset.area;
                await this.loadRecipesByArea(area);
            });
        });
    }

    /**
     * Load recipes by area
     * @param {string} area - Area name
     */
    async loadRecipesByArea(area) {
        try {
            showLoading();
            updatePageHeader(`${area} Cuisine`, `Explore authentic ${area.toLowerCase()} recipes`);
            document.getElementById('searchSection').style.display = 'none';

            const recipes = await this.api.getRecipesByArea(area);
            if (recipes.length > 0) {
                // Get full recipe details for better display
                const detailedRecipes = await this.api.getFullRecipeDetails(recipes);
                this.displayRecipes(detailedRecipes);
            } else {
                showNoResults();
            }
        } catch (error) {
            showError('Failed to load area recipes. Please try again.');
        }
    }

    /**
     * Display ingredients in grid
     * @param {Array} ingredients - Array of ingredients
     */
    displayIngredients(ingredients) {
        const container = document.getElementById('resultsGrid');
        
        if (!ingredients || ingredients.length === 0) {
            showNoResults();
            return;
        }

        const html = ingredients.map(ingredient => UIComponents.createIngredientCard(ingredient)).join('');
        container.innerHTML = html;
        hideLoading();

        // Add click handlers for ingredient cards
        document.querySelectorAll('[data-ingredient]').forEach(card => {
            card.addEventListener('click', async (e) => {
                const ingredient = e.currentTarget.dataset.ingredient;
                await this.loadRecipesByIngredient(ingredient);
            });
        });
    }

    /**
     * Load recipes by ingredient
     * @param {string} ingredient - Ingredient name
     */
    async loadRecipesByIngredient(ingredient) {
        try {
            showLoading();
            updatePageHeader(`Recipes with ${ingredient}`, `Discover recipes containing ${ingredient.toLowerCase()}`);
            document.getElementById('searchSection').style.display = 'none';

            const recipes = await this.api.getRecipesByIngredient(ingredient);
            if (recipes.length > 0) {
                // Get full recipe details for better display
                const detailedRecipes = await this.api.getFullRecipeDetails(recipes);
                this.displayRecipes(detailedRecipes);
            } else {
                showNoResults();
            }
        } catch (error) {
            showError('Failed to load ingredient recipes. Please try again.');
        }
    }

    /**
     * Show recipe details in modal
     * @param {string} recipeId - Recipe ID
     */
    async showRecipeDetails(recipeId) {
        try {
            // Use the getRecipeById method to get the specific recipe
            const recipe = await this.api.getRecipeById(recipeId);
            
            if (!recipe) {
                throw new Error('Recipe not found');
            }

            const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
            const modalBody = document.getElementById('recipeModalBody');
            const modalTitle = document.getElementById('recipeModalLabel');
            const sourceLink = document.getElementById('recipeSource');
            const youtubeLink = document.getElementById('recipeYoutube');

            modalTitle.textContent = recipe.strMeal;
            modalBody.innerHTML = UIComponents.createRecipeModalContent(recipe);

            // Setup source and YouTube links
            if (recipe.strSource) {
                sourceLink.href = recipe.strSource;
                sourceLink.style.display = 'inline-block';
            } else {
                sourceLink.style.display = 'none';
            }

            if (recipe.strYoutube) {
                youtubeLink.href = recipe.strYoutube;
                youtubeLink.style.display = 'inline-block';
            } else {
                youtubeLink.style.display = 'none';
            }

            modal.show();
        } catch (error) {
            console.error('Error showing recipe details:', error);
            showError('Failed to load recipe details. Please try again.');
        }
    }

    /**
     * Handle contact form submission
     * @param {HTMLFormElement} form - Contact form
     */
    handleContactForm(form) {
        // Basic form validation
        const name = form.contactName.value.trim();
        const email = form.contactEmail.value.trim();
        const password = form.contactPassword.value;
        const confirmPassword = form.contactConfirmPassword.value;

        let isValid = true;

        // Name validation
        if (!name || name.length < 2) {
            this.showFieldError('contactName', 'Please enter a valid name (minimum 2 characters)');
            isValid = false;
        } else {
            this.hideFieldError('contactName');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showFieldError('contactEmail', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.hideFieldError('contactEmail');
        }

        // Password validation
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            this.showFieldError('contactPassword', 'Password must be at least 8 characters with letters and numbers');
            isValid = false;
        } else {
            this.hideFieldError('contactPassword');
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            this.showFieldError('contactConfirmPassword', 'Passwords do not match');
            isValid = false;
        } else {
            this.hideFieldError('contactConfirmPassword');
        }

        if (isValid) {
            // Simulate form submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('Thank you for your message! We will get back to you soon.');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
                modal.hide();
            }, 2000);
        }
    }

    /**
     * Show field error
     * @param {string} fieldId - Field ID
     * @param {string} message - Error message
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        
        field.classList.add('is-invalid');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    /**
     * Hide field error
     * @param {string} fieldId - Field ID
     */
    hideFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.remove('is-invalid');
    }
}

// ========================================
// INITIALIZATION
// ========================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen after a short delay
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.visibility = 'hidden';
            document.body.style.overflow = 'auto';
        }
    }, 1500);

    // Initialize the application
    window.recipeFinderApp = new RecipeFinderApp();
});

// Handle window resize for responsive sidebar
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        // On desktop, ensure sidebar is properly positioned
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebar.classList.contains('active')) {
            mainContent.classList.add('sidebar-open');
        }
    } else {
        // On mobile, close sidebar
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.remove('active');
        mainContent.classList.remove('sidebar-open');
    }
});

