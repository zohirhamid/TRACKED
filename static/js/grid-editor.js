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
    const firstInput = formContent.querySelector('input, select');
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
            if (durationText && durationText.includes('-')) {
                const parts = durationText.split('-');
                return { start: parts[0], end: parts[1] };
            }
            return { start: '', end: '' };
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
            const start = currentValue?.start || '';
            const end = currentValue?.end || '';
            return `
                <div class="form-group">
                    <label class="form-label">Start Time</label>
                    <input type="time" 
                           class="form-input" 
                           id="editValueStart" 
                           value="${start}"
                           placeholder="HH:MM">
                </div>
                <div class="form-group">
                    <label class="form-label">End Time</label>
                    <input type="time" 
                           class="form-input" 
                           id="editValueEnd" 
                           value="${end}"
                           placeholder="HH:MM">
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
    
    // Get value based on type
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
            const start = document.getElementById('editValueStart').value;
            const end = document.getElementById('editValueEnd').value;
            value = (start && end) ? { start, end } : null;
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
        // Escape to close
        if (e.key === 'Escape') {
            closeEditModal();
        }
        // Enter to save
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEntry();
        }
    }
});