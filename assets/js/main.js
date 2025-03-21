/**
 * PlayGameStation - Main JavaScript File
 * 
 * This file handles the dynamic loading of game data and UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize site functionality
    initializeGameData();
    setupEventListeners();
});

/**
 * Loads game data from JSON files and populates dynamic elements
 */
async function initializeGameData() {
    try {
        // Fetch games data
        const gamesResponse = await fetch('/data/games.json');
        const gamesData = await gamesResponse.json();
        
        // Fetch categories data
        const categoriesResponse = await fetch('/data/categories.json');
        const categoriesData = await categoriesResponse.json();
        
        // Store data in global scope for easy access
        window.gameData = {
            games: gamesData.games,
            categories: categoriesData.categories
        };
        
        // Update game cards with real data (if we're on a page that needs it)
        if (document.querySelector('.game-cards-container')) {
            populateGameCards();
        }
        
        // Check if we're on a category page
        const categoryId = getCurrentCategoryId();
        if (categoryId) {
            loadCategoryGames(categoryId);
        }
        
        // Check if we're on a game detail page
        const gameId = getCurrentGameId();
        if (gameId) {
            loadRelatedGames(gameId);
        }
        
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

/**
 * Sets up event listeners for interactive elements
 */
function setupEventListeners() {
    // Mobile menu toggle (if exists)
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Search form (if exists)
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = document.getElementById('search-input').value;
            if (searchTerm.trim()) {
                searchGames(searchTerm);
            }
        });
    }
    
    // Newsletter form (if exists)
    const newsletterForm = document.querySelector('form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim()) {
                // In a real application, this would send the data to a server
                alert('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            }
        });
    }
}

/**
 * Extracts the current category ID from the URL if on a category page
 */
function getCurrentCategoryId() {
    const path = window.location.pathname;
    const categoryMatch = path.match(/\/categories\/([a-z0-9-]+)\.html/);
    return categoryMatch ? categoryMatch[1] : null;
}

/**
 * Extracts the current game ID from the URL if on a game detail page
 */
function getCurrentGameId() {
    const path = window.location.pathname;
    const gameMatch = path.match(/\/games\/([a-z0-9-]+)\.html/);
    return gameMatch ? gameMatch[1] : null;
}

/**
 * Populates a category page with games from that category
 */
function loadCategoryGames(categoryId) {
    if (!window.gameData) return;
    
    const categoryGames = window.gameData.games.filter(game => {
        return game.categories.includes(categoryId);
    });
    
    const categoryInfo = window.gameData.categories.find(cat => cat.id === categoryId);
    
    // Update category title and description if elements exist
    const categoryTitle = document.getElementById('category-title');
    const categoryDescription = document.getElementById('category-description');
    
    if (categoryTitle && categoryInfo) {
        categoryTitle.textContent = categoryInfo.name;
    }
    
    if (categoryDescription && categoryInfo) {
        categoryDescription.textContent = categoryInfo.description;
    }
    
    // Find the container for category games
    const gamesContainer = document.getElementById('category-games');
    if (!gamesContainer) return;
    
    // Clear existing content
    gamesContainer.innerHTML = '';
    
    // Add games to the container
    categoryGames.forEach(game => {
        const gameCard = createGameCard(game);
        gamesContainer.appendChild(gameCard);
    });
    
    // If no games found
    if (categoryGames.length === 0) {
        gamesContainer.innerHTML = '<p class="text-center py-8">No games found in this category yet. Check back soon!</p>';
    }
}

/**
 * Loads related games for a specific game
 */
function loadRelatedGames(gameId) {
    if (!window.gameData) return;
    
    const currentGame = window.gameData.games.find(game => game.id === gameId);
    if (!currentGame || !currentGame.relatedGames) return;
    
    const relatedGamesContainer = document.getElementById('related-games');
    if (!relatedGamesContainer) return;
    
    // Clear existing content
    relatedGamesContainer.innerHTML = '';
    
    // Get related games data
    const relatedGames = currentGame.relatedGames
        .map(id => window.gameData.games.find(game => game.id === id))
        .filter(game => game); // Filter out any undefined games
    
    // Add related games to the container
    relatedGames.forEach(game => {
        const gameCard = createGameCard(game, true); // true = simplified card
        relatedGamesContainer.appendChild(gameCard);
    });
}

/**
 * Creates a game card element based on game data
 */
function createGameCard(game, simplified = false) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition';
    
    // Create game card HTML
    if (simplified) {
        // Simplified version for related games
        card.innerHTML = `
            <a href="/games/${game.id}.html" class="block">
                <div class="h-40 bg-apple-gray flex items-center justify-center relative">
                    <span class="text-white text-lg absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">${game.title}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold mb-2">${game.title}</h3>
                    <p class="text-sm text-apple-gray">${game.description}</p>
                </div>
            </a>
        `;
    } else {
        // Full version for category pages
        const categoriesHTML = game.categories
            .map(catId => {
                const category = window.gameData.categories.find(c => c.id === catId);
                return category 
                    ? `<span class="bg-apple-blue text-white text-xs px-2 py-1 rounded mr-2 mb-1">${category.name}</span>`
                    : '';
            })
            .join('');
            
        card.innerHTML = `
            <a href="/games/${game.id}.html" class="block">
                <div class="h-48 bg-apple-gray flex items-center justify-center relative">
                    <span class="text-white text-xl absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">${game.title}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${game.title}</h3>
                    <p class="text-apple-gray mb-2">${game.description}</p>
                    <div class="flex flex-wrap">
                        ${categoriesHTML}
                    </div>
                </div>
            </a>
        `;
    }
    
    return card;
}

/**
 * Search games based on search term
 */
function searchGames(searchTerm) {
    if (!window.gameData) return;
    
    searchTerm = searchTerm.toLowerCase();
    
    const searchResults = window.gameData.games.filter(game => {
        return game.title.toLowerCase().includes(searchTerm) || 
               game.description.toLowerCase().includes(searchTerm) ||
               (game.longDescription && game.longDescription.toLowerCase().includes(searchTerm));
    });
    
    // In a real implementation, this would update a search results page
    // For now, we'll just log the results to console
    console.log('Search results:', searchResults);
    
    // Redirect to a search results page (if it exists)
    if (typeof displaySearchResults === 'function') {
        displaySearchResults(searchResults, searchTerm);
    }
} 