// ============================================
// GRID EDITOR - Cell Editing Logic
// ============================================

let currentEditingCell = null;

// Initialize grid editor
document.addEventListener('DOMContentLoaded', function() {
    const editableCells = document.querySelectorAll('.grid-cell-editable');
    
    editableCells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    
    // Close modal on overlay click
    const modalOverlay = document.getElementById('editModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeEditModal();
            }
        });
    }
});

// Handle cell click
function handleCellClick(e) {
    const cell = e.currentTarget;
    const trackerId = cell.dataset.trackerId;
    const trackerType = cell.dataset.trackerType;
    const date = cell.dataset.date;
    const entryId = cell.dataset.entryId;
    
    currentEditingCell = cell;
    
    openEditModal(trackerId, trackerType, date, entryId, cell);
}

// Open edit modal
function openEditModal(trackerId, trackerType, date, entryId, cell) {
    console.log('trackerType:', trackerType);
    const modal = document.getElementById('editModal');
    const formContent = document.getElementById('editFormContent');
    
    // Set hidden fields
    document.getElementById('editTrackerId').value = trackerId;
    document.getElementById('editDate').value = date;
    document.getElementById('editEntryId').value = entryId || '';
    
    // Get current value from cell
    const currentValue = getCurrentCellValue(cell, trackerType);
    
    // Build form based on tracker type
    formContent.innerHTML = buildFormForType(trackerType, currentValue);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus first input
    const firstInput = formContent.querySelector('input, select, textarea');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Get current cell value
function getCurrentCellValue(cell, trackerType) {
    const valueElement = cell.querySelector('.grid-cell-value');
    if (!valueElement) return null;
    
    switch(trackerType) {
        case 'binary':
            return cell.querySelector('.grid-check') ? true : false;
        
        case 'number':
            const numText = valueElement.textContent.trim();
            return numText ? parseFloat(numText) : '';
        
        case 'time':
            const timeText = valueElement.textContent.trim();
            return timeText || '';
        
        case 'duration':
            const durationText = valueElement.textContent.trim();
            if (!durationText) return 0;
            
            let totalMinutes = 0;
            const hourMatch = durationText.match(/(\d+)h/);
            const minMatch = durationText.match(/(\d+)min/);
            
            if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
            if (minMatch) totalMinutes += parseInt(minMatch[1]);
            
            return totalMinutes;
        
        case 'text':
            const textElement = cell.querySelector('.grid-text');
            return textElement ? textElement.getAttribute('title') || textElement.textContent.trim() : '';
        
        case 'rating':
            const ratingText = valueElement.textContent.trim();
            return ratingText ? parseInt(ratingText.split('/')[0]) : '';
        
        default:
            return '';
    }
}

// Build form HTML based on tracker type
function buildFormForType(type, currentValue) {
    switch(type) {
        case 'binary':
            return `
                <div class="form-group">
                    <label class="form-label">Value</label>
                    <select class="form-select" id="editValue">
                        <option value="">Not tracked</option>
                        <option value="true" ${currentValue === true ? 'selected' : ''}>Yes ✓</option>
                        <option value="false" ${currentValue === false ? 'selected' : ''}>No ✗</option>
                    </select>
                </div>
            `;
        
        case 'number':
            return `
                <div class="form-group">
                    <label class="form-label">Value</label>
                    <input type="number" 
                           step="0.1" 
                           class="form-input" 
                           id="editValue" 
                           value="${currentValue || ''}"
                           placeholder="Enter number">
                </div>
            `;
        
        case 'time':
            return `
                <div class="form-group">
                    <label class="form-label">Time</label>
                    <input type="time" 
                           class="form-input" 
                           id="editValue" 
                           value="${currentValue || ''}"
                           placeholder="HH:MM">
                </div>
            `;
        
        case 'duration':
            const currentMinutes = currentValue || 0;
            const currentHours = Math.floor(currentMinutes / 60);
            const currentMins = currentMinutes % 60;
            
            return `
                <div class="form-group">
                    <label class="form-label">Hours</label>
                    <input type="number" 
                        min="0"
                        max="24"
                        class="form-input" 
                        id="editValueHours" 
                        value="${currentHours}"
                        placeholder="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Minutes</label>
                    <input type="number" 
                        min="0"
                        max="59"
                        class="form-input" 
                        id="editValueMinutes" 
                        value="${currentMins}"
                        placeholder="0">
                </div>
            `;
        
        case 'text':
            return `
                <div class="form-group">
                    <label class="form-label">Text/Notes</label>
                    <textarea class="form-input" 
                              id="editValue" 
                              rows="4"
                              placeholder="Enter your notes...">${currentValue || ''}</textarea>
                </div>
            `;
        
        case 'rating':
            const cell = currentEditingCell;
            const minValue = parseInt(cell.getAttribute('data-min-value')) || 1;
            const maxValue = parseInt(cell.getAttribute('data-max-value')) || 5;
            
            let options = '<option value="">Not rated</option>';
            for (let i = minValue; i <= maxValue; i++) {
                options += `<option value="${i}" ${currentValue === i ? 'selected' : ''}>${i}</option>`;
            }
            
            return `
                <div class="form-group">
                    <label class="form-label">Rating (${minValue}-${maxValue})</label>
                    <select class="form-select" id="editValue">
                        ${options}
                    </select>
                </div>
            `;
        
        default:
            return '<p>Unknown tracker type</p>';
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    currentEditingCell = null;
}

// Save entry
function saveEntry() {
    const trackerId = document.getElementById('editTrackerId').value;
    const date = document.getElementById('editDate').value;
    const entryId = document.getElementById('editEntryId').value;
    const trackerType = currentEditingCell.dataset.trackerType;
    
    let value = null;
    
    switch(trackerType) {
        case 'binary':
            const selectValue = document.getElementById('editValue').value;
            value = selectValue === '' ? null : selectValue === 'true';
            break;
        
        case 'number':
            const numValue = document.getElementById('editValue').value;
            value = numValue === '' ? null : parseFloat(numValue);
            break;
        
        case 'time':
            value = document.getElementById('editValue').value || null;
            break;
        
        case 'duration':
            const hours = parseInt(document.getElementById('editValueHours').value) || 0;
            const minutes = parseInt(document.getElementById('editValueMinutes').value) || 0;
            value = hours * 60 + minutes;
            break;
        
        case 'text':
            value = document.getElementById('editValue').value || null;
            break;
        
        case 'rating':
            const ratingValue = document.getElementById('editValue').value;
            value = ratingValue === '' ? null : parseInt(ratingValue);
            break;
    }
    
    // Show loading state
    const saveButton = document.getElementById('saveButtonText');
    const spinner = document.getElementById('saveButtonSpinner');
    saveButton.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    // Call AJAX save function
    saveEntryAjax(trackerId, date, trackerType, value, entryId);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('editModal');
    if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeEditModal();
        }
        if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            saveEntry();
        }
    }
});