document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const statusDiv = document.getElementById('status');
    const existingItemsContainer = document.getElementById('existing-items-container');
    const addItemForm = document.getElementById('add-item-form');
    const saveBtn = document.getElementById('save-btn');
    const newImageFileInput = document.getElementById('new-image-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const categoryDatalist = document.getElementById('categories');

    // --- State ---
    let fullFileContent = '';
    let menuItemsData = [];
    let newImageData = null;

    // --- GitHub Repo Details ---
    const REPO_OWNER = 'Mahmoud-Walid1';
    const REPO_NAME = 'Tikka_plate';
    const FILE_PATH = 'index.html';
    const BRANCH_NAME = 'main';
    
    // --- Functions ---
    function parseMenuItems(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return Array.from(doc.querySelectorAll('.menu-item')).map(div => ({
            category: div.dataset.category,
            name: div.querySelector('h3').textContent.trim(),
            description: div.querySelector('p').textContent.trim(),
            price: parseFloat(div.querySelector('.price').textContent),
            image: div.querySelector('img').getAttribute('src').replace('images/', ''),
        }));
    }

    function renderMenuItems() {
        existingItemsContainer.innerHTML = '';
        const categories = new Set();
        menuItemsData.forEach((item, index) => {
            categories.add(item.category);
            const itemCard = document.createElement('div');
            itemCard.className = 'card item-card';
            itemCard.dataset.index = index;
            itemCard.innerHTML = `
                <img src="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}/images/${item.image}" alt="${item.name}">
                <div class="item-inputs">
                    <input type="text" value="${item.name}" class="item-name" placeholder="اسم الطبق">
                    <input type="number" value="${item.price}" class="item-price" placeholder="السعر">
                    <textarea class="item-description" rows="3" placeholder="الوصف">${item.description}</textarea>
                </div>
                <div class="item-actions">
                    <button class="delete-btn">حذف</button>
                </div>
            `;
            existingItemsContainer.appendChild(itemCard);
        });
        // Populate category datalist
        categoryDatalist.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            categoryDatalist.appendChild(option);
        });
        saveBtn.disabled = false;
    }

    async function fetchMenu() {
        statusDiv.textContent = 'جاري تحميل آخر نسخة من المنيو...';
        statusDiv.className = 'status';
        try {
            const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}/${FILE_PATH}`);
            if (!response.ok) throw new Error('فشل الاتصال بالريبو.');
            
            fullFileContent = await response.text();
            
            const startMarker = '<div class="menu-grid">';
            const endMarker = '</div>';
            const startIndex = fullFileContent.indexOf(startMarker);
            const endIndex = fullFileContent.lastIndexOf(endMarker);
            
            if (startIndex === -1 || endIndex === -1) throw new Error('لم يتم العثور على قسم المنيو.');
            
            const menuHTML = fullFileContent.substring(startIndex + startMarker.length, endIndex);
            menuItemsData = parseMenuItems(menuHTML);
            renderMenuItems();
            statusDiv.textContent = 'تم التحميل بنجاح. جاهز للتعديل.';
            statusDiv.className = 'status success';
        } catch (error) {
            statusDiv.textContent = `فشل تحميل المنيو: ${error.message}`;
            statusDiv.className = 'status error';
        }
    }

    function rebuildMenuHTMLFromUI() {
        let items = [];
        existingItemsContainer.querySelectorAll('.item-card').forEach(card => {
            const originalItem = menuItemsData[card.dataset.index];
            items.push({
                ...originalItem,
                name: card.querySelector('.item-name').value,
                price: card.querySelector('.item-price').value,
                description: card.querySelector('.item-description').value,
            });
        });

        return items.map(item => `
            <div class="menu-item" data-category="${item.category}">
                <img src="images/${item.image}" alt="${item.name}" loading="lazy">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="price">${item.price} ريال</span>
                <button class="add-to-cart-btn" data-name="${item.name}" data-price="${item.price}">أضف للطلب</button>
            </div>`).join('\n');
    }

    // --- Event Listeners ---
    newImageFileInput.addEventListener('change', () => {
        const file = newImageFileInput.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                // Get base64 content, without the data URL prefix
                newImageData = e.target.result.split(',')[1];
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = 'لم يتم اختيار أي ملف';
            newImageData = null;
        }
    });

    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('new-name').value,
            price: document.getElementById('new-price').value,
            image: document.getElementById('new-image-name').value,
            category: document.getElementById('new-category').value,
            description: document.getElementById('new-description').value,
        };
        
        // Add to the end of the menu
        const newHtml = `
            <div class="menu-item" data-category="${newItem.category}">
                <img src="images/${newItem.image}" alt="${newItem.name}" loading="lazy">
                <h3>${newItem.name}</h3>
                <p>${newItem.description}</p>
                <span class="price">${newItem.price} ريال</span>
                <button class="add-to-cart-btn" data-name="${newItem.name}" data-price="${newItem.price}">أضف للطلب</button>
            </div>`;
        
        // A bit of a hack to add to the UI immediately, proper way is to rebuild
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newHtml;
        const newCard = tempDiv.firstElementChild;
        // existingItemsContainer.appendChild(newCard); // This won't work easily now
        
        statusDiv.textContent = 'تم تجهيز الطبق للإضافة. اضغط "حفظ" لرفع كل التغييرات.';
        statusDiv.className = 'status success';
        
        // Instead of adding to UI, we'll just add to data and ask user to save
        menuItemsData.push(newItem);
        saveBtn.click(); // Automatically trigger save
    });

    existingItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('هل أنت متأكد أنك تريد حذف هذا الطبق؟')) {
                const cardToDelete = e.target.closest('.item-card');
                const indexToDelete = parseInt(cardToDelete.dataset.index, 10);
                
                // Mark for deletion by hiding
                cardToDelete.style.display = 'none'; 
                cardToDelete.classList.add('deleted');

                statusDiv.textContent = 'تم حذف الطبق. اضغط "حفظ" لتأكيد الحذف.';
                statusDiv.className = 'status success';
            }
        }
    });

    saveBtn.addEventListener('click', async () => {
        if (!confirm('هل أنت متأكد أنك تريد رفع كل التغييرات على الموقع الرئيسي؟')) return;

        saveBtn.disabled = true;
        statusDiv.textContent = 'جاري الحفظ ورفع التحديث...';
        statusDiv.className = 'status';

        // Rebuild data from UI, excluding deleted items
        const updatedItems = [];
        existingItemsContainer.querySelectorAll('.item-card:not(.deleted)').forEach(card => {
             const originalItem = menuItemsData[card.dataset.index];
             updatedItems.push({
                ...originalItem,
                name: card.querySelector('.item-name').value,
                price: card.querySelector('.item-price').value,
                description: card.querySelector('.item-description').value,
            });
        });
        
        // Add newly submitted item if form is filled
        const newName = document.getElementById('new-name').value;
        if (newName && newImageData) {
            updatedItems.push({
                name: newName,
                price: document.getElementById('new-price').value,
                image: document.getElementById('new-image-name').value,
                category: document.getElementById('new-category').value,
                description: document.getElementById('new-description').value,
            });
        }
        
        // Generate final HTML
        const newMenuItemsHTML = updatedItems.map(item => `
            <div class="menu-item" data-category="${item.category}">
                <img src="images/${item.image}" alt="${item.name}" loading="lazy">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="price">${item.price} ريال</span>
                <button class="add-to-cart-btn" data-name="${item.name}" data-price="${item.price}">أضف للطلب</button>
            </div>`).join('\n');

        const startMarker = '<div class="menu-grid">';
        const endMarker = '</div>';
        const startIndex = fullFileContent.indexOf(startMarker);
        const endIndex = fullFileContent.lastIndexOf(endMarker);
        const newFullContent = fullFileContent.substring(0, startIndex + startMarker.length) + '\n' + newMenuItemsHTML + '\n            ' + fullFileContent.substring(endIndex);
        
        const payload = { newContent: newFullContent };
        if (newName && newImageData) {
            payload.newImage = {
                name: document.getElementById('new-image-name').value,
                content: newImageData
            };
        }

        try {
            const response = await fetch('/api/update-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'حدث خطأ غير معروف.');
            
            statusDiv.textContent = 'تم التحديث بنجاح! جاري إعادة تحميل الصفحة...';
            statusDiv.className = 'status success';
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            statusDiv.textContent = `فشل التحديث: ${error.message}`;
            statusDiv.className = 'status error';
        } finally {
            saveBtn.disabled = false;
        }
    });
    
    // Initial Load
    fetchMenu();
});
