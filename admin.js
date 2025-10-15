document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const existingItemsContainer = document.getElementById('existing-items-container');
    const addItemForm = document.getElementById('add-item-form');
    const saveBtn = document.getElementById('save-btn');
    const newImageFileInput = document.getElementById('new-image-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const categoryDatalist = document.getElementById('categories');

    let fullFileContent = '';
    let menuItemsData = [];
    let newImageData = null;
    let newImageName = '';

    const REPO_OWNER = 'Mahmoud-Walid1';
    const REPO_NAME = 'Tikka_plate';
    const FILE_PATH = 'index.html';
    const BRANCH_NAME = 'main';
    
    function parseMenuItems(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return Array.from(doc.querySelectorAll('.menu-item')).map(div => ({
            id: Date.now() + Math.random(), // Unique ID for virtual DOM
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
        categories.forEach(cat => {
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
            
            if (startIndex === -1 || endIndex === -1) throw new Error('لم يتم العثور على علامات المنيو.');
            
            const menuHTML = fullFileContent.substring(startIndex, endIndex);
            menuItemsData = parseMenuItems(menuHTML);
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
            newImageName = document.getElementById('new-image-name').value || file.name.replace(/\s+/g, '-');
            
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
            image: document.getElementById('new-image-name').value,
            category: document.getElementById('new-category').value,
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

        const updatedItems = Array.from(existingItemsContainer.querySelectorAll('.item-card')).map(card => {
            const id = parseFloat(card.dataset.id);
            const originalItem = menuItemsData.find(item => item.id === id);
            return {
                ...originalItem,
                name: card.querySelector('.item-name').value,
                price: card.querySelector('.item-price').value,
                description: card.querySelector('.item-description').value,
            };
        });
        
        const allCategories = [...new Set(updatedItems.map(item => item.category))];
        
        const newFilterButtonsHTML = `
            <div class="menu-filters">
                <button class="filter-btn active" data-filter="all">الكل</button>
                ${allCategories.map(cat => `<button class="filter-btn" data-filter="${cat.toLowerCase().replace(/\s+/g, '-')}">${cat}</button>`).join('\n                ')}
            </div>`;
        
        const newMenuItemsHTML = `
            <div class="menu-grid">
                ${updatedItems.map(item => `
                <div class="menu-item" data-category="${item.category.toLowerCase().replace(/\s+/g, '-')}">
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

        tempFullContent = tempFullContent.substring(0, tempFullContent.indexOf(filterStart) + filterStart.length) + newFilterButtonsHTML + tempFullContent.substring(tempFullContent.indexOf(filterEnd));
        tempFullContent = tempFullContent.substring(0, tempFullContent.indexOf(menuStart) + menuStart.length) + newMenuItemsHTML + tempFullContent.substring(tempFullContent.indexOf(menuEnd));
        
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

        } catch (error) {
            statusDiv.textContent = `فشل التحديث: ${error.message}`;
            statusDiv.className = 'status error';
        } finally {
            saveBtn.disabled = false;
        }
    });
    
    fetchMenu();
});
