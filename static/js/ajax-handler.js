// ============================================
// AJAX HANDLER - Save entries to backend
// ============================================

function saveEntryAjax(trackerId, date, trackerType, value, entryId) {
    const url = '/tracker/entry/save/';
    
    const data = {
        tracker_id: trackerId,
        date: date,
        tracker_type: trackerType,
        entry_id: entryId || null
    };
    
    if (value === null) {
        data.delete_entry = true;
    } else {
        switch(trackerType) {
            case 'binary':
                data.binary_value = value;
                break;
            case 'number':
                data.number_value = value;
                break;
            case 'time':
                data.time_value = value;
                break;
            case 'duration':
                data.duration_minutes = value;
                break;
            case 'text':
                data.text_value = value;
                break;
            case 'rating':
                data.rating_value = value;
                break;
        }
    }
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCellDisplay(currentEditingCell, trackerType, value, data.entry_id);
            showToast('Entry saved successfully', 'success');
            closeEditModal();
        } else {
            showToast(data.error || 'Failed to save entry', 'error');
            resetSaveButton();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Network error. Please try again.', 'error');
        resetSaveButton();
    });
}

function updateCellDisplay(cell, trackerType, value, entryId) {
    cell.dataset.entryId = entryId;
    cell.innerHTML = '';
    
    if (value === null) {
        cell.innerHTML = '<div class="grid-cell-empty">—</div>';
    } else {
        const valueDiv = document.createElement('div');
        valueDiv.className = 'grid-cell-value';
        
        switch(trackerType) {
            case 'binary':
                valueDiv.innerHTML = value 
                    ? '<span class="grid-check">✓</span>'
                    : '<span class="grid-cross">✗</span>';
                break;
            
            case 'number':
                valueDiv.innerHTML = `<span class="grid-number">${value}</span>`;
                break;
            
            case 'time':
                valueDiv.innerHTML = `<span class="grid-time">${value}</span>`;
                break;
            
            case 'duration':
                const hours = Math.floor(value / 60);
                const mins = value % 60;
                let displayText = '';
                
                if (hours > 0 && mins > 0) {
                    displayText = `${hours}h ${mins}min`;
                } else if (hours > 0) {
                    displayText = `${hours}h`;
                } else {
                    displayText = `${mins}min`;
                }
                
                valueDiv.innerHTML = `<span class="grid-duration">${displayText}</span>`;
                break;
            
            case 'text':
                const truncated = value.split(' ').slice(0, 3).join(' ');
                valueDiv.innerHTML = `<span class="grid-text" title="${value}">${truncated}</span>`;
                break;
            
            case 'rating':
                const minVal = cell.dataset.minValue;
                const maxVal = cell.dataset.maxValue;
                const display = (minVal && maxVal) ? `${value}/${maxVal}` : value;
                valueDiv.innerHTML = `<span class="grid-rating">${display}</span>`;
                break;
        }
        
        cell.appendChild(valueDiv);
    }
    
    cell.classList.add('saved');
    setTimeout(() => {
        cell.classList.remove('saved');
    }, 600);
}

function resetSaveButton() {
    const saveButton = document.getElementById('saveButtonText');
    const spinner = document.getElementById('saveButtonSpinner');
    saveButton.style.display = 'inline';
    spinner.style.display = 'none';
}