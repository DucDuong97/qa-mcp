(function initRecorderStudioRecords(globalScope) {
  const RECORDS_STORAGE_KEY = 'recorderStudio.savedRecords';

  function cloneActions(actions) {
    return JSON.parse(JSON.stringify(actions || []));
  }

  function sanitizeRecords(records) {
    if (!Array.isArray(records)) {
      return [];
    }

    return records.filter((item) => (
      item &&
      typeof item.name === 'string' &&
      item.name.trim() &&
      Array.isArray(item.actions)
    ));
  }

  function loadRecordsFromLocalStorage() {
    try {
      const rawRecords = globalScope.localStorage.getItem(RECORDS_STORAGE_KEY);
      if (!rawRecords) {
        return [];
      }

      return sanitizeRecords(JSON.parse(rawRecords));
    } catch (err) {
      console.error('❌ Failed to load records from localStorage:', err);
      return [];
    }
  }

  function saveRecordsToLocalStorage(records) {
    try {
      globalScope.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(sanitizeRecords(records)));
      return true;
    } catch (err) {
      console.error('❌ Failed to persist records to localStorage:', err);
      return false;
    }
  }

  function findRecordByName(records, name) {
    return sanitizeRecords(records).find((record) => record.name === name) || null;
  }

  function upsertRecord(records, recordName, actions) {
    const normalizedName = String(recordName || '').trim();
    if (!normalizedName) {
      throw new Error('Record name is required.');
    }

    const nextRecords = sanitizeRecords(records).map((item) => ({ ...item }));
    const existingIndex = nextRecords.findIndex((record) => record.name === normalizedName);
    const nextRecord = {
      name: normalizedName,
      actions: cloneActions(actions),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      nextRecords[existingIndex] = nextRecord;
    } else {
      nextRecords.push(nextRecord);
    }

    nextRecords.sort((a, b) => a.name.localeCompare(b.name));
    return {
      records: nextRecords,
      overwritten: existingIndex >= 0
    };
  }

  globalScope.RecorderStudioRecords = {
    cloneActions,
    loadRecordsFromLocalStorage,
    saveRecordsToLocalStorage,
    findRecordByName,
    upsertRecord
  };
})(window);
