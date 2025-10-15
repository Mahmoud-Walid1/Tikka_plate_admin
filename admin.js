document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const statusDiv = document.getElementById('status');
    const existingItemsContainer = document.getElementById('existing-items-container');
    const addItemForm = document.getElementById('add-item-form');
    const saveBtn = document.getElementById('save-btn');
    const newImageFileInput = document.getElementById('new-image-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const categoryDatalist = document.getElementById('categories');

    // --- State (Source of Truth) ---
    let fullFileContent = '';
    let menuItemsData = []; // This array is now the single source of truth.
    let newImageData = null;
    let newImageName = '';

    // --- GitHub Repo Details ---
    const REPO_OWNER = 'Mahmoud-Walid1';
    const REPO_NAME = 'Tikka_plate';
    const FILE_PATH = 'index.html';
    const BRANCH_NAME = 'main';
    
    // --- Functions ---

    // THIS IS THE NEW, MORE ROBUST PARSING FUNCTION
    function parseMenuItems(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString; // Directly inject the HTML fragment
        const itemDivs = tempDiv.querySelectorAll('.menu-item');
        
        if (itemDivs.length === 0) {
            console.warn("Parsing found 0 menu items in the provided HTML string.");
            return [];
        }

        return Array.from(itemDivs).map(div => {
            const nameEl = div.querySelector('h3');
            const descEl = div.querySelector('p');
            const priceEl = div.querySelector('.price');
            const imgEl = div.querySelector('img');

            if (!nameEl || !descEl || !priceEl || !imgEl) return null;

            return {
                id: Date.now() + Math.random(),
                category: div.dataset.category,
                name: nameEl.textContent.trim(),
                description: descEl.textContent.trim(),
                price: parseFloat(priceEl.textContent),
                image: imgEl.getAttribute('src').replace('images/', ''),
            };
        }).filter(item => item !== null);
    }

    function renderMenuItems() {
        existingItemsContainer.innerHTML = '';
        const categories = new Set();
        menuItemsData.forEach(item => {
            categories.add(item.category);
            const itemCard = document.createElement('div');
            itemCard.className = 'card item-card';
            itemCard.dataset.id = item.id;
            itemCard.innerHTML = `
                <img src="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}/images/${item.image}" alt="${item.name}">
                <div class="item-inputs">
                    <input type="text" value="${item.name}" class="item-name" placeholder="اسم الطبق">
                    <input type="number" value="${item.price}" class="item-price" placeholder="السعر">
                    <textarea class="item-description" rows="3" placeholder="الوصف">${item.description}</textarea>
                </div>
                <div class="item-actions"><button class="delete-btn">حذف</button></div>`;
            existingItemsContainer.appendChild(itemCard);
        });
        categoryDatalist.innerHTML = '';
        [...categories].sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            categoryDatalist.appendChild(option);
        });
        saveBtn.disabled = false;
    }

    async function fetchMenu() {
        statusDiv.textContent = 'جاري تحميل آخر نسخة...';
        statusDiv.className = 'status';
        try {
            const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}/${FILE_PATH}?t=${Date.now()}`);
            if (!response.ok) throw new Error('فشل الاتصال بالريبو.');
            
            fullFileContent = await response.text();
            
            const startMarker = '';
            const endMarker = '';
            const startIndex = fullFileContent.indexOf(startMarker);
            const endIndex = fullFileContent.indexOf(endMarker);
            
            if (startIndex === -1 || endIndex === -1) throw new Error('لم يتم العثور على علامات المنيو في الملف.');
            
            const menuHTML = fullFileContent.substring(startIndex + startMarker.length, endIndex);

            menuItemsData = parseMenuItems(menuHTML);
            
            if (menuItemsData.length === 0) {
                 throw new Error('تم تحليل الملف ولكن لم يتم العثور على أي أصناف. تأكد من أن الأصناف موجودة بين علامات المنيو.');
            }

            renderMenuItems();
            statusDiv.textContent = 'تم التحميل بنجاح.';
            statusDiv.className = 'status success';
        } catch (error) {
            statusDiv.textContent = `فشل التحميل: ${error.message}`;
            statusDiv.className = 'status error';
        }
    }

    newImageFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            fileNameDisplay.textContent = 'لم يتم اختيار ملف';
            newImageData = null;
            return;
        }
        fileNameDisplay.textContent = `ضغط: ${file.name}`;
        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200 });
            fileNameDisplay.textContent = `ضغط بنجاح! (${(compressedFile.size / 1024).toFixed(1)} KB)`;
            newImageName = document.getElementById('new-image-name').value.trim().replace(/\s+/g, '-') || file.name.replace(/\s+/g, '-');
            
            const reader = new FileReader();
            reader.onload = (e) => { newImageData = e.target.result.split(',')[1]; };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            fileNameDisplay.textContent = 'خطأ في الضغط.';
            newImageData = null;
        }
    });

    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItemData = {
            id: Date.now(),
            name: document.getElementById('new-name').value,
            price: document.getElementById('new-price').value,
            image: document.getElementById('new-image-name').value.trim().replace(/\s+/g, '-'),
            category: document.getElementById('new-category').value.toLowerCase().replace(/\s+/g, '-'),
            description: document.getElementById('new-description').value,
        };
        menuItemsData.push(newItemData);
        renderMenuItems();
        addItemForm.reset();
        fileNameDisplay.textContent = 'لم يتم اختيار ملف';
        statusDiv.textContent = 'تمت الإضافة. اضغط "حفظ" لرفع التغييرات.';
        statusDiv.className = 'status success';
    });

    existingItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('هل أنت متأكد؟')) {
                const cardToDelete = e.target.closest('.item-card');
                const idToDelete = parseFloat(cardToDelete.dataset.id);
                menuItemsData = menuItemsData.filter(item => item.id !== idToDelete);
                renderMenuItems();
                statusDiv.textContent = 'تم الحذف. اضغط "حفظ" للتأكيد.';
                statusDiv.className = 'status success';
            }
        }
    });

    saveBtn.addEventListener('click', async () => {
        if (!confirm('هل تريد رفع كل التغييرات للموقع الرئيسي؟')) return;

        saveBtn.disabled = true;
        statusDiv.textContent = 'جاري الحفظ ورفع التحديث...';
        statusDiv.className = 'status';

        menuItemsData.forEach(item => {
            const card = existingItemsContainer.querySelector(`[data-id="${item.id}"]`);
            if (card) {
                item.name = card.querySelector('.item-name').value;
                item.price = card.querySelector('.item-price').value;
                item.description = card.querySelector('.item-description').value;
            }
        });

        const allCategories = [...new Set(menuItemsData.map(item => item.category))].sort();
        
        const newFilterButtonsHTML = `
            <div class="menu-filters">
                <button class="filter-btn active" data-filter="all">الكل</button>
                ${allCategories.map(cat => `<button class="filter-btn" data-filter="${cat}">${cat.replace(/-/g, ' ')}</button>`).join('\n                ')}
            </div>`;
        
        const newMenuItemsHTML = `
            <div class="menu-grid">
                ${menuItemsData.map(item => `
                <div class="menu-item" data-category="${item.category}">
                    <img src="images/${item.image}" alt="${item.name}" loading="lazy">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span class="price">${item.price} ريال</span>
                    <button class="add-to-cart-btn" data-name="${item.name}" data-price="${item.price}">أضف للطلب</button>
                </div>`).join('\n                ')}
            </div>`;

        let tempFullContent = fullFileContent;
        const filterStart = '';
        const filterEnd = '';
        const menuStart = '';
        const menuEnd = '';

        const filterStartIndex = tempFullContent.indexOf(filterStart);
        const filterEndIndex = tempFullContent.indexOf(filterEnd);
        if (filterStartIndex > -1 && filterEndIndex > -1) {
            tempFullContent = tempFullContent.slice(0, filterStartIndex + filterStart.length) + newFilterButtonsHTML + tempFullContent.slice(filterEndIndex);
        }

        const menuStartIndex = tempFullContent.indexOf(menuStart);
        const menuEndIndex = tempFullContent.indexOf(menuEnd);
        if (menuStartIndex > -1 && menuEndIndex > -1) {
            tempFullContent = tempFullContent.slice(0, menuStartIndex + menuStart.length) + newMenuItemsHTML + tempFullContent.slice(menuEndIndex);
        }
        
        const payload = { newContent: tempFullContent };
        if (newImageData && newImageName) {
            payload.newImage = { name: newImageName, content: newImageData };
        }

        try {
            const response = await fetch('/api/update-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'حدث خطأ.');
            
            statusDiv.textContent = 'تم التحديث بنجاح! جاري إعادة التحميل...';
            statusDiv.className = 'status success';
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) => {
            statusDiv.textContent = `فشل التحديث: ${error.message}`;
            statusDiv.className = 'status error';
        } finally {
            saveBtn.disabled = false;
        }
    });
    
    // Initial Load
    fetchMenu();
});
