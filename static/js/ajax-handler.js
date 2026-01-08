// ============================================
// AJAX HANDLER - Save entries to backend
// ============================================

function saveEntryAjax(trackerId, date, trackerType, value, entryId) {
    const url = '/entry/save/';  // Your Django URL
    
    // Prepare data
    const data = {
        tracker_id: trackerId,
        date: date,
        tracker_type: trackerType,
        entry_id: entryId || null
    };
    
    // Add value based on type
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
                data.duration_start = value.start;
                data.duration_end = value.end;
                break;
        }
    }
    
    // Make AJAX request
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
            // Update cell display
            updateCellDisplay(currentEditingCell, trackerType, value, data.entry_id);
            
            // Show success
            showToast('Entry saved successfully', 'success');
            
            // Close modal
            closeEditModal();
        } else {
            // Show error
            showToast(data.error || 'Failed to save entry', 'error');
            
            // Reset button
            resetSaveButton();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Network error. Please try again.', 'error');
        resetSaveButton();
    });
}

// Update cell display after save
function updateCellDisplay(cell, trackerType, value, entryId) {
    // Update entry ID
    cell.dataset.entryId = entryId;
    
    // Clear existing content
    cell.innerHTML = '';
    
    // Add new content based on value
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
                valueDiv.innerHTML = `<span class="grid-duration">${value.start}-${value.end}</span>`;
                break;
        }
        
        cell.appendChild(valueDiv);
    }
    
    // Flash success animation
    cell.classList.add('saved');
    setTimeout(() => {
        cell.classList.remove('saved');
    }, 600);
}

// Reset save button state
function resetSaveButton() {
    const saveButton = document.getElementById('saveButtonText');
    const spinner = document.getElementById('saveButtonSpinner');
    saveButton.style.display = 'inline';
    spinner.style.display = 'none';
}