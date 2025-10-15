document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const statusDiv = document.getElementById('status');
    const existingItemsContainer = document.getElementById('existing-items-container');
    const addItemForm = document.getElementById('add-item-form');
    const saveBtn = document.getElementById('save-btn');

    // --- State ---
    let fullFileContent = ''; // To store the original index.html content
    let menuItemsData = []; // To store the parsed menu items as objects

    // --- GitHub Repo Details ---
    const REPO_OWNER = 'Mahmoud-Walid1'; // Your correct GitHub username
    const REPO_NAME = 'Tikka_plate';   // Your correct repository name
    const FILE_PATH = 'index.html';
    const BRANCH_NAME = 'main';

    // --- Functions ---

    /**
     * Parses the raw HTML of the menu grid into an array of objects
     */
    function parseMenuItems(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const itemDivs = doc.querySelectorAll('.menu-item');
        const items = [];
        itemDivs.forEach(div => {
            items.push({
                category: div.dataset.category,
                name: div.querySelector('h3').textContent.trim(),
                description: div.querySelector('p').textContent.trim(),
                price: parseFloat(div.querySelector('.price').textContent),
                image: div.querySelector('img').getAttribute('src').replace('images/', ''),
            });
        });
        return items;
    }

    /**
     * Renders the array of item objects into editable cards in the UI
     */
    function renderMenuItems() {
        existingItemsContainer.innerHTML = '';
        menuItemsData.forEach((item, index) => {
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
        saveBtn.disabled = false;
    }

    /**
     * Fetches the initial menu content from GitHub
     */
    async function fetchMenu() {
        statusDiv.textContent = 'جاري تحميل آخر نسخة من المنيو...';
        statusDiv.className = 'status';
        try {
            const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}/${FILE_PATH}`);
            if (!response.ok) throw new Error('فشل الاتصال بالريبو. تأكد من صحة البيانات.');
            
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

    /**
     * Rebuilds the final HTML for the menu grid from the current UI state
     */
    function rebuildMenuHTML() {
        let newMenuHTML = '';
        const itemCards = existingItemsContainer.querySelectorAll('.item-card');
        itemCards.forEach(card => {
            const index = card.dataset.index;
            const originalItem = menuItemsData[index];

            const name = card.querySelector('.item-name').value;
            const price = card.querySelector('.item-price').value;
            const description = card.querySelector('.item-description').value;

            newMenuHTML += `
                <div class="menu-item" data-category="${originalItem.category}">
                    <img src="images/${originalItem.image}" alt="${name}" loading="lazy">
                    <h3>${name}</h3>
                    <p>${description}</p>
                    <span class="price">${price} ريال</span>
                    <button class="add-to-cart-btn" data-name="${name}" data-price="${price}">أضف للطلب</button>
                </div>`;
        });
        return newMenuHTML;
    }

    // --- Event Listeners ---

    // Add a new item
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('new-name').value,
            price: parseFloat(document.getElementById('new-price').value),
            image: document.getElementById('new-image').value,
            category: document.getElementById('new-category').value,
            description: document.getElementById('new-description').value,
        };
        // This is a simplified way to add to the UI. A more robust solution would rebuild the data array.
        const tempIndex = menuItemsData.length;
        menuItemsData.push(newItem); // Add to data array
        const itemCard = document.createElement('div');
        itemCard.className = 'card item-card';
        itemCard.dataset.index = tempIndex;
        itemCard.innerHTML = `
            <img src="images/${newItem.image}" alt="${newItem.name}">
            <div class="item-inputs">
                <input type="text" value="${newItem.name}" class="item-name" placeholder="اسم الطبق">
                <input type="number" value="${newItem.price}" class="item-price" placeholder="السعر">
                <textarea class="item-description" rows="3" placeholder="الوصف">${newItem.description}</textarea>
            </div>
            <div class="item-actions">
                <button class="delete-btn">حذف</button>
            </div>
        `;
        existingItemsContainer.appendChild(itemCard);
        addItemForm.reset();
        statusDiv.textContent = 'تمت إضافة الطبق. اضغط "حفظ" لرفع التغييرات.';
        statusDiv.className = 'status success';
    });

    // Delete an item
    existingItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('هل أنت متأكد أنك تريد حذف هذا الطبق؟')) {
                const cardToDelete = e.target.closest('.item-card');
                cardToDelete.remove();
                statusDiv.textContent = 'تم حذف الطبق. اضغط "حفظ" لتأكيد الحذف.';
                statusDiv.className = 'status success';
            }
        }
    });

    // Save and Deploy all changes
    saveBtn.addEventListener('click', async () => {
        if (!confirm('هل أنت متأكد أنك تريد رفع كل التغييرات على الموقع الرئيسي؟')) return;

        saveBtn.disabled = true;
        statusDiv.textContent = 'جاري الحفظ ورفع التحديث...';
        statusDiv.className = 'status';
        
        // This needs to be smarter for adds/deletes, for now it rebuilds based on UI
        const newMenuItemsHTML = rebuildMenuHTMLFromUI();

        const startMarker = '<div class="menu-grid">';
        const endMarker = '</div>';
        const startIndex = fullFileContent.indexOf(startMarker);
        const endIndex = fullFileContent.lastIndexOf(endMarker);
        
        if (startIndex === -1 || endIndex === -1) {
             statusDiv.textContent = 'خطأ في تكوين الملف الجديد.';
             statusDiv.className = 'status error';
             saveBtn.disabled = false;
             return;
        }
        
        const newFullContent = fullFileContent.substring(0, startIndex + startMarker.length) + '\n' + newMenuItemsHTML + '\n            ' + fullFileContent.substring(endIndex);

        try {
            const response = await fetch('/api/update-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newContent: newFullContent }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'حدث خطأ غير معروف.');
            statusDiv.textContent = 'تم التحديث بنجاح! قد يستغرق الموقع دقيقة ليظهر التغيير.';
            statusDiv.className = 'status success';
        } catch (error) {
            statusDiv.textContent = `فشل التحديث: ${error.message}`;
            statusDiv.className = 'status error';
        } finally {
            saveBtn.disabled = false;
        }
    });
    
    function rebuildMenuHTMLFromUI() {
        let html = '';
        const cards = existingItemsContainer.querySelectorAll('.item-card');
        cards.forEach(card => {
            const name = card.querySelector('.item-name').value;
            const price = card.querySelector('.item-price').value;
            const desc = card.querySelector('.item-description').value;
            const img = card.querySelector('img').src.split('/').pop();
            // This is tricky, category is not stored in the card. Let's find it from the original data
            const originalItem = menuItemsData[card.dataset.index];
            const category = originalItem ? originalItem.category : 'main'; 

            html += `
                <div class="menu-item" data-category="${category}">
                    <img src="images/${img}" alt="${name}" loading="lazy">
                    <h3>${name}</h3>
                    <p>${desc}</p>
                    <span class="price">${price} ريال</span>
                    <button class="add-to-cart-btn" data-name="${name}" data-price="${price}">أضف للطلب</button>
                </div>`;
        });
        return html.trim();
    }

    // Initial Load
    fetchMenu();
});
