/**
 * PlayGameStation - Main JavaScript
 * 动态加载游戏和分类数据，管理网站交互
 */

document.addEventListener('DOMContentLoaded', function() {
    // 检查当前页面类型并加载相应数据
    const currentPath = window.location.pathname;
    
    if (currentPath === '/' || currentPath.endsWith('index.html')) {
        loadHomePageData();
    } else if (currentPath.includes('/games/')) {
        loadGameDetails();
    } else if (currentPath.includes('/categories/')) {
        loadCategoryData();
    }
    
    // 初始化共享组件（如导航高亮）
    initializeSharedComponents();
});

/**
 * 加载首页数据
 */
async function loadHomePageData() {
    try {
        const response = await fetch('/data/games.json');
        if (!response.ok) throw new Error('无法获取游戏数据');
        
        const gameData = await response.json();
        
        // 加载热门游戏
        const featuredGamesContainer = document.getElementById('featured-games');
        if (featuredGamesContainer) {
            const featuredGames = gameData.filter(game => game.featured === true).slice(0, 4);
            renderGameCards(featuredGamesContainer, featuredGames);
        }
        
        // 加载最近添加的游戏
        const recentGamesContainer = document.getElementById('recent-games');
        if (recentGamesContainer) {
            // 按添加日期排序，显示最新的4个游戏
            const recentGames = [...gameData].sort((a, b) => {
                return new Date(b.added_date || '2023-01-01') - new Date(a.added_date || '2023-01-01');
            }).slice(0, 4);
            
            renderGameCards(recentGamesContainer, recentGames);
        }
        
        // 加载分类数据
        loadCategoriesForHomepage();
        
    } catch (error) {
        console.error('加载首页数据时出错:', error);
    }
}

/**
 * 加载分类数据到首页
 */
async function loadCategoriesForHomepage() {
    try {
        const response = await fetch('/data/categories.json');
        if (!response.ok) throw new Error('无法获取分类数据');
        
        const categoriesData = await response.json();
        const featuredCategories = categoriesData.filter(category => category.featured).slice(0, 3);
        
        const categoriesContainer = document.getElementById('game-categories');
        if (categoriesContainer && featuredCategories.length > 0) {
            categoriesContainer.innerHTML = '';
            
            featuredCategories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition';
                
                categoryCard.innerHTML = `
                    <a href="/categories/${category.id}.html" class="block">
                        <div class="h-48 bg-apple-gray flex items-center justify-center relative">
                            <div class="text-5xl">${category.icon || '🎮'}</div>
                            <span class="text-white text-xl absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">${category.name}</span>
                        </div>
                        <div class="p-4">
                            <h3 class="font-semibold text-lg mb-2">${category.name}</h3>
                            <p class="text-apple-gray mb-2">${category.description}</p>
                        </div>
                    </a>
                `;
                
                categoriesContainer.appendChild(categoryCard);
            });
        }
    } catch (error) {
        console.error('加载分类数据时出错:', error);
    }
}

/**
 * 加载游戏详情页面数据
 */
async function loadGameDetails() {
    try {
        const gameId = getGameIdFromUrl();
        if (!gameId) return;
        
        const response = await fetch('/data/games.json');
        if (!response.ok) throw new Error('无法获取游戏数据');
        
        const gamesData = await response.json();
        const gameData = gamesData.find(game => game.id === gameId);
        
        if (!gameData) {
            console.error('未找到游戏数据:', gameId);
            return;
        }
        
        // 更新页面标题和描述
        document.title = `${gameData.title} - PlayGameStation`;
        updateMetaDescription(gameData.description);
        
        // 填充游戏详情
        populateGameDetails(gameData);
        
        // 加载相关游戏
        loadRelatedGames(gameData, gamesData);
        
    } catch (error) {
        console.error('加载游戏详情时出错:', error);
    }
}

/**
 * 填充游戏详情到页面
 */
function populateGameDetails(gameData) {
    // 更新游戏标题
    const titleElement = document.getElementById('game-title');
    if (titleElement) titleElement.textContent = gameData.title;
    
    // 更新游戏描述
    const descriptionElement = document.getElementById('game-description');
    if (descriptionElement) descriptionElement.textContent = gameData.description;
    
    // 更新游戏iframe
    const gameContainer = document.getElementById('game-iframe-container');
    if (gameContainer && gameData.iframe) {
        gameContainer.innerHTML = gameData.iframe;
    }
    
    // 更新游戏特性
    const featuresElement = document.getElementById('game-features');
    if (featuresElement && gameData.features && gameData.features.length > 0) {
        const featuresList = document.createElement('ul');
        featuresList.className = 'feature-list';
        
        gameData.features.forEach(feature => {
            const listItem = document.createElement('li');
            listItem.textContent = feature;
            featuresList.appendChild(listItem);
        });
        
        featuresElement.appendChild(featuresList);
    }
    
    // 更新游戏控制说明
    const controlsElement = document.getElementById('game-controls');
    if (controlsElement && gameData.controls) {
        controlsElement.textContent = gameData.controls;
    }
    
    // 更新长描述
    const longDescElement = document.getElementById('game-long-description');
    if (longDescElement && gameData.long_description) {
        longDescElement.textContent = gameData.long_description;
    }
}

/**
 * 加载相关游戏
 */
function loadRelatedGames(currentGame, allGames) {
    const relatedGamesContainer = document.getElementById('related-games');
    if (!relatedGamesContainer) return;
    
    let relatedGames = [];
    
    // 如果当前游戏有指定相关游戏
    if (currentGame.related_games && currentGame.related_games.length > 0) {
        currentGame.related_games.forEach(relatedGameId => {
            const relatedGame = allGames.find(game => game.id === relatedGameId);
            if (relatedGame) relatedGames.push(relatedGame);
        });
    }
    
    // 如果相关游戏不足3个，根据分类添加更多
    if (relatedGames.length < 3 && currentGame.categories) {
        const additionalGames = allGames.filter(game => 
            game.id !== currentGame.id && 
            !relatedGames.some(rg => rg.id === game.id) &&
            game.categories && 
            game.categories.some(cat => currentGame.categories.includes(cat))
        ).slice(0, 3 - relatedGames.length);
        
        relatedGames = [...relatedGames, ...additionalGames];
    }
    
    // 如果仍然不足3个，添加随机游戏
    if (relatedGames.length < 3) {
        const randomGames = allGames.filter(game => 
            game.id !== currentGame.id && 
            !relatedGames.some(rg => rg.id === game.id)
        ).sort(() => 0.5 - Math.random()).slice(0, 3 - relatedGames.length);
        
        relatedGames = [...relatedGames, ...randomGames];
    }
    
    // 渲染相关游戏
    renderGameCards(relatedGamesContainer, relatedGames);
}

/**
 * 加载分类页面数据
 */
async function loadCategoryData() {
    try {
        const categoryId = getCategoryIdFromUrl();
        if (!categoryId) return;
        
        // 加载分类信息
        const categoryResponse = await fetch('/data/categories.json');
        if (!categoryResponse.ok) throw new Error('无法获取分类数据');
        
        const categoriesData = await categoryResponse.json();
        const categoryData = categoriesData.find(category => category.id === categoryId);
        
        if (!categoryData) {
            console.error('未找到分类数据:', categoryId);
            return;
        }
        
        // 更新分类标题和描述
        const categoryTitle = document.getElementById('category-title');
        if (categoryTitle) categoryTitle.textContent = categoryData.name;
        
        const categoryDescription = document.getElementById('category-description');
        if (categoryDescription) categoryDescription.textContent = categoryData.description;
        
        // 加载该分类下的游戏
        const gamesResponse = await fetch('/data/games.json');
        if (!gamesResponse.ok) throw new Error('无法获取游戏数据');
        
        const gamesData = await gamesResponse.json();
        const categoryGames = gamesData.filter(game => 
            game.categories && game.categories.includes(categoryId)
        );
        
        // 渲染分类游戏
        const categoryGamesContainer = document.getElementById('category-games');
        if (categoryGamesContainer && categoryGames.length > 0) {
            renderGameCards(categoryGamesContainer, categoryGames);
        }
        
        // 更新特色游戏
        if (categoryData.featured_games && categoryData.featured_games.length > 0) {
            const featuredGames = [];
            categoryData.featured_games.forEach(gameId => {
                const game = gamesData.find(g => g.id === gameId);
                if (game) featuredGames.push(game);
            });
            
            const featuredContainer = document.getElementById('featured-category-games');
            if (featuredContainer && featuredGames.length > 0) {
                renderGameCards(featuredContainer, featuredGames);
            }
        }
        
    } catch (error) {
        console.error('加载分类数据时出错:', error);
    }
}

/**
 * 渲染游戏卡片到指定容器
 */
function renderGameCards(container, games) {
    if (!container || !games || games.length === 0) return;
    
    // 清空现有内容，但保留非动态加载的内容
    const staticContent = Array.from(container.children).filter(
        child => child.classList.contains('static-content')
    );
    
    container.innerHTML = '';
    staticContent.forEach(element => {
        container.appendChild(element);
    });
    
    // 添加游戏卡片
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition';
        
        gameCard.innerHTML = `
            <a href="/games/${game.id}.html" class="block">
                <div class="h-48 bg-apple-gray flex items-center justify-center relative">
                    ${game.thumbnail ? 
                    `<img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover">` : 
                    `<span class="text-white text-xl">${game.title}</span>`}
                    <span class="text-white text-xl absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">${game.title}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${game.title}</h3>
                    <p class="text-apple-gray mb-2">${game.description}</p>
                    <div class="flex flex-wrap">
                        ${game.categories ? game.categories.map(category => 
                            `<span class="bg-apple-blue text-white text-xs px-2 py-1 rounded mr-2 mb-1">${category}</span>`
                        ).join('') : ''}
                    </div>
                </div>
            </a>
        `;
        
        container.appendChild(gameCard);
    });
}

/**
 * 从URL中获取游戏ID
 */
function getGameIdFromUrl() {
    const path = window.location.pathname;
    const matches = path.match(/\/games\/([^\/]+)\.html/);
    return matches ? matches[1] : null;
}

/**
 * 从URL中获取分类ID
 */
function getCategoryIdFromUrl() {
    const path = window.location.pathname;
    const matches = path.match(/\/categories\/([^\/]+)\.html/);
    return matches ? matches[1] : null;
}

/**
 * 更新页面的meta描述
 */
function updateMetaDescription(description) {
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
}

/**
 * 初始化共享组件
 */
function initializeSharedComponents() {
    // 导航高亮
    highlightCurrentNavItem();
    
    // 其他共享初始化...
}

/**
 * 高亮当前导航项
 */
function highlightCurrentNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || 
            (href !== '/' && currentPath.includes(href)) ||
            (currentPath === '/' && href === '/index.html')) {
            link.classList.add('font-bold');
        } else {
            link.classList.remove('font-bold');
        }
    });
} 