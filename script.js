document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const elements = {
      // Main UI
      sidebar: document.getElementById('sidebar'),
      menuToggle: document.getElementById('menu-toggle'),
      emptyState: document.getElementById('empty-state'),
      noteEditor: document.getElementById('note-editor'),
      notesList: document.getElementById('notes-list'),
      
      // Note creation
      newNoteBtn: document.getElementById('new-note-btn'),
      emptyNewNoteBtn: document.getElementById('empty-new-note-btn'),
      
      // Editor elements
      noteTitle: document.getElementById('note-title'),
      noteContent: document.getElementById('note-content'),
      noteDate: document.getElementById('note-date'),
      noteWordcount: document.getElementById('note-wordcount'),
      pinNoteBtn: document.getElementById('pin-note-btn'),
      saveNoteBtn: document.getElementById('save-note-btn'),
      
      // Actions dropdown
      moreActionsBtn: document.getElementById('more-actions-btn'),
      moreMenu: document.getElementById('more-menu'),
      deleteNoteBtn: document.getElementById('delete-note-btn'),
      
      // Toolbar
      toolbarButtons: document.querySelectorAll('.toolbar-btn'),
      addImageBtn: document.getElementById('add-image-btn'),
      imageInput: document.getElementById('image-input'),
      fontSelect: document.getElementById('font-select'),
      fontSize: document.getElementById('font-size'),
      
      // Search
      searchNotes: document.getElementById('search-notes'),
      
      // Tabs
      tabs: document.querySelectorAll('.tab'),
      
      // Settings
      themeToggle: document.getElementById('theme-toggle'),
      settingsBtn: document.getElementById('settings-btn'),
      settingsModal: document.getElementById('settings-modal'),
      closeSettings: document.getElementById('close-settings'),
      themeButtons: document.querySelectorAll('.theme-btn'),
      appFont: document.getElementById('app-font'),
      exportNotesBtn: document.getElementById('export-notes-btn'),
      importNotesBtn: document.getElementById('import-notes-btn'),
      importInput: document.getElementById('import-input'),
      resetDataBtn: document.getElementById('reset-data-btn'),
      
      // Confirmation modal
      confirmModal: document.getElementById('confirm-modal'),
      confirmTitle: document.getElementById('confirm-title'),
      confirmMessage: document.getElementById('confirm-message'),
      confirmOk: document.getElementById('confirm-ok'),
      confirmCancel: document.getElementById('confirm-cancel'),
      
      // Toast
      toast: document.getElementById('toast')
  };
  
  // Application state
  const state = {
      notes: [],
      trashNotes: [],
      currentNoteId: null,
      currentTab: 'all',
      searchTerm: '',
      unsavedChanges: false,
      settings: {
          theme: 'system',
          font: 'Poppins'
      }
  };
  
  // Initialize application
  function init() {
      loadData();
      setupEventListeners();
      applySettings();
      renderUI();
      
      // Auto-open first note if exists
      if (state.notes.length > 0) {
          openNote(state.notes[0].id);
      }
  }
  
  // Load data from localStorage
  function loadData() {
      try {
          // Load notes
          const savedNotes = localStorage.getItem('notebook-notes');
          if (savedNotes) {
              state.notes = JSON.parse(savedNotes);
          }
          
          // Load trash
          const savedTrash = localStorage.getItem('notebook-trash');
          if (savedTrash) {
              state.trashNotes = JSON.parse(savedTrash);
          }
          
          // Load settings
          const savedSettings = localStorage.getItem('notebook-settings');
          if (savedSettings) {
              state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
          }
      } catch (err) {
          console.error('Error loading data:', err);
          showToast('Terjadi kesalahan saat memuat data', 'error');
      }
  }
  
  // Save notes to localStorage
  function saveNotes() {
      try {
          localStorage.setItem('notebook-notes', JSON.stringify(state.notes));
      } catch (err) {
          console.error('Error saving notes:', err);
          showToast('Terjadi kesalahan saat menyimpan catatan', 'error');
      }
  }
  
  // Save trash to localStorage
  function saveTrash() {
      try {
          localStorage.setItem('notebook-trash', JSON.stringify(state.trashNotes));
      } catch (err) {
          console.error('Error saving trash:', err);
      }
  }
  
  // Save settings to localStorage
  function saveSettings() {
      try {
          localStorage.setItem('notebook-settings', JSON.stringify(state.settings));
      } catch (err) {
          console.error('Error saving settings:', err);
      }
  }
  
  // Set up event listeners
  function setupEventListeners() {
      // Toggle sidebar on mobile
      if (elements.menuToggle) {
          elements.menuToggle.addEventListener('click', () => {
              elements.sidebar.classList.toggle('active');
          });
      }
      
      // Create new note buttons
      elements.newNoteBtn.addEventListener('click', createNewNote);
      elements.emptyNewNoteBtn.addEventListener('click', createNewNote);
      
      // Note editing
      elements.noteTitle.addEventListener('input', markUnsaved);
      elements.noteContent.addEventListener('input', () => {
          markUnsaved();
          updateWordCount();
      });
      
      // Pin note
      elements.pinNoteBtn.addEventListener('click', togglePinNote);
      
      // Save note
      elements.saveNoteBtn.addEventListener('click', saveCurrentNote);
      
      // More actions dropdown
      elements.moreActionsBtn.addEventListener('click', toggleMoreMenu);
      
      // Delete note
      elements.deleteNoteBtn.addEventListener('click', deleteCurrentNote);
      
      // Toolbar buttons
      elements.toolbarButtons.forEach(btn => {
          if (btn.dataset.command) {
              btn.addEventListener('click', () => {
                  document.execCommand(btn.dataset.command, false, null);
                  elements.noteContent.focus();
                  markUnsaved();
              });
          }
      });
      
      // Font select
      elements.fontSelect.addEventListener('change', () => {
          document.execCommand('fontName', false, elements.fontSelect.value);
          elements.noteContent.focus();
          markUnsaved();
      });
      
      // Font size
      elements.fontSize.addEventListener('change', () => {
          document.execCommand('fontSize', false, elements.fontSize.value);
          elements.noteContent.focus();
          markUnsaved();
      });
      
      // Add image
      elements.addImageBtn.addEventListener('click', () => {
          elements.imageInput.click();
      });
      
      elements.imageInput.addEventListener('change', handleImageUpload);
      
      // Search notes
      elements.searchNotes.addEventListener('input', (e) => {
          state.searchTerm = e.target.value.toLowerCase().trim();
          renderNotesList();
      });
      
      // Tab switching
      elements.tabs.forEach(tab => {
          tab.addEventListener('click', () => {
              const tabId = tab.dataset.tab;
              
              elements.tabs.forEach(t => {
                  t.classList.remove('active');
              });
              tab.classList.add('active');
              
              state.currentTab = tabId;
              state.searchTerm = '';
              elements.searchNotes.value = '';
              
              renderNotesList();
              
              // If we switched away from trash, close the current note
              if (state.currentTab !== 'trash' && state.currentNoteId && isNoteInTrash(state.currentNoteId)) {
                  closeNote();
              }
          });
      });
      
      // Theme toggle
      elements.themeToggle.addEventListener('click', toggleTheme);
      
      // Settings modal
      elements.settingsBtn.addEventListener('click', () => {
          elements.settingsModal.classList.remove('hidden');
      });
      
      elements.closeSettings.addEventListener('click', () => {
          elements.settingsModal.classList.add('hidden');
      });
      
      // Theme buttons
      elements.themeButtons.forEach(btn => {
          btn.addEventListener('click', () => {
              const theme = btn.dataset.theme;
              setTheme(theme);
              
              elements.themeButtons.forEach(b => {
                  b.classList.remove('active');
              });
              btn.classList.add('active');
          });
      });
      
      // App font select
      elements.appFont.addEventListener('change', () => {
          state.settings.font = elements.appFont.value;
          saveSettings();
          applySettings();
      });
      
      // Export notes
      elements.exportNotesBtn.addEventListener('click', exportData);
      
      // Import notes
      elements.importNotesBtn.addEventListener('click', () => {
          elements.importInput.click();
      });
      
      elements.importInput.addEventListener('change', handleImportData);
      
      // Reset data
      elements.resetDataBtn.addEventListener('click', confirmResetData);
      
      // Confirm modal
      elements.confirmCancel.addEventListener('click', () => {
          elements.confirmModal.classList.add('hidden');
      });
      
      // Close modals when clicking on overlay
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', () => {
              elements.settingsModal.classList.add('hidden');
              elements.confirmModal.classList.add('hidden');
          });
      });
      
      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
          if (!e.target.closest('#more-actions-btn') && !e.target.closest('#more-menu')) {
              elements.moreMenu.classList.add('hidden');
          }
      });
      
      // Handle window resize
      window.addEventListener('resize', () => {
          if (window.innerWidth >= 768) {
              elements.sidebar.classList.remove('active');
          }
      });
      
      // Listen for dark mode changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
      
      // Warn before leaving with unsaved changes
      window.addEventListener('beforeunload', (e) => {
          if (state.unsavedChanges) {
              e.preventDefault();
              e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?';
              return e.returnValue;
          }
      });
  }
  
  // Apply settings
  function applySettings() {
      // Set font
      document.body.style.fontFamily = `'${state.settings.font}', sans-serif`;
      elements.appFont.value = state.settings.font;
      
      // Apply theme
      checkDarkMode();
      
      // Highlight active theme button
      elements.themeButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.theme === state.settings.theme);
      });
  }
  
  // Check and apply dark mode based on settings and system preference
  function checkDarkMode() {
      const theme = state.settings.theme;
      
      if (theme === 'dark' || (theme === 'system' && 
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }
  
  // Toggle theme directly
  function toggleTheme() {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
  }
  
  // Set theme and save it
  function setTheme(theme) {
      state.settings.theme = theme;
      saveSettings();
      checkDarkMode();
  }
  
  // Render the entire UI
  function renderUI() {
      renderNotesList();
      updateEmptyState();
  }
  
  // Update empty state visibility
  function updateEmptyState() {
      if (state.notes.length === 0 && state.currentTab === 'all') {
          elements.emptyState.classList.remove('hidden');
          elements.noteEditor.classList.add('hidden');
      } else {
          elements.emptyState.classList.add('hidden');
      }
  }
  
  // Render notes list based on current tab and search
  function renderNotesList() {
      elements.notesList.innerHTML = '';
      
      let filteredNotes = [];
      
      // Get the right set of notes based on the current tab
      if (state.currentTab === 'all') {
          filteredNotes = state.notes;
      } else if (state.currentTab === 'favorites') {
          filteredNotes = state.notes.filter(note => note.pinned);
      } else if (state.currentTab === 'trash') {
          filteredNotes = state.trashNotes;
      }
      
      // Apply search filter if needed
      if (state.searchTerm) {
          filteredNotes = filteredNotes.filter(note => 
              note.title.toLowerCase().includes(state.searchTerm) || 
              stripHtml(note.content).toLowerCase().includes(state.searchTerm)
          );
      }
      
      // Show empty message if no notes found
      if (filteredNotes.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.className = 'p-4 text-center text-gray-500';
          
          if (state.searchTerm) {
              emptyMessage.textContent = 'Tidak ada catatan yang sesuai pencarian';
          } else if (state.currentTab === 'favorites') {
              emptyMessage.textContent = 'Belum ada catatan favorit';
          } else if (state.currentTab === 'trash') {
              emptyMessage.textContent = 'Sampah kosong';
          } else {
              emptyMessage.textContent = 'Belum ada catatan';
          }
          
          elements.notesList.appendChild(emptyMessage);
          
          // Update empty state
          updateEmptyState();
          
          return;
      }
      
      // Sort notes: pinned first, then by last modified date
      filteredNotes.sort((a, b) => {
          // First sort by pinned status (if not in trash)
          if (state.currentTab !== 'trash') {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
          }
          
          // Then sort by modification date (newest first)
          return b.lastModified - a.lastModified;
      });
      
      // Create note cards
      filteredNotes.forEach(note => {
          const noteCard = document.createElement('div');
          noteCard.className = 'note-card';
          
          if (note.id === state.currentNoteId) {
              noteCard.classList.add('active');
          }
          
          if (note.pinned && state.currentTab !== 'trash') {
              noteCard.classList.add('pinned');
          }
          
          const titleHtml = note.pinned && state.currentTab !== 'trash' 
              ? `<div class="note-card-title">${note.title || 'Tanpa Judul'} <i class="fas fa-star text-yellow-400"></i></div>`
              : `<div class="note-card-title">${note.title || 'Tanpa Judul'}</div>`;
          
          noteCard.innerHTML = `
              ${titleHtml}
              <div class="note-card-preview">${stripHtml(note.content)}</div>
              <div class="note-card-date">${formatDate(note.lastModified)}</div>
          `;
          
          noteCard.addEventListener('click', () => {
              if (state.currentTab === 'trash') {
                  showConfirmDialog(
                      'Pulihkan Catatan',
                      'Apakah Anda ingin memulihkan catatan ini?',
                      () => {
                          restoreNote(note.id);
                      },
                      'Pulihkan'
                  );
              } else {
                  openNote(note.id);
              }
          });
          
          elements.notesList.appendChild(noteCard);
      });
      
      // Update empty state
      updateEmptyState();
  }
  
  // Create a new note
  function createNewNote() {
      const newNote = {
          id: Date.now().toString(),
          title: '',
          content: '',
          created: Date.now(),
          lastModified: Date.now(),
          pinned: false
      };
      
      state.notes.unshift(newNote);
      saveNotes();
      
      // Switch to "all" tab if needed
      if (state.currentTab !== 'all') {
          state.currentTab = 'all';
          elements.tabs.forEach(tab => {
              tab.classList.toggle('active', tab.dataset.tab === 'all');
          });
      }
      
      openNote(newNote.id);
      showToast('Catatan baru dibuat', 'success');
      
      // Close sidebar on mobile after creating a note
      if (window.innerWidth < 768) {
          elements.sidebar.classList.remove('active');
      }
  }
  
  // Open a note
  function openNote(id) {
      // Check if we need to save the current note first
      if (state.unsavedChanges && state.currentNoteId) {
          showConfirmDialog(
              'Simpan Perubahan',
              'Catatan saat ini memiliki perubahan yang belum disimpan. Simpan sekarang?',
              () => {
                  saveCurrentNote();
                  loadNote(id);
              },
              'Simpan',
              () => {
                  state.unsavedChanges = false;
                  loadNote(id);
              },
              'Buang Perubahan'
          );
      } else {
          loadNote(id);
      }
  }
  
  // Load note content into editor
  function loadNote(id) {
      let note;
      
      if (state.currentTab === 'trash') {
          note = state.trashNotes.find(n => n.id === id);
      } else {
          note = state.notes.find(n => n.id === id);
      }
      
      if (!note) return;
      
      state.currentNoteId = id;
      state.unsavedChanges = false;
      
      elements.noteTitle.value = note.title;
      elements.noteContent.innerHTML = note.content;
      elements.noteDate.textContent = `Terakhir diubah: ${formatDate(note.lastModified)}`;
      
      // Update pin button
      if (state.currentTab === 'trash') {
          elements.pinNoteBtn.style.display = 'none';
      } else {
          elements.pinNoteBtn.style.display = 'flex';
          elements.pinNoteBtn.innerHTML = note.pinned 
              ? '<i class="fas fa-star"></i>' 
              : '<i class="far fa-star"></i>';
          elements.pinNoteBtn.title = note.pinned ? 'Lepas pin' : 'Pin catatan';
      }
      
      // Show editor
      elements.noteEditor.classList.remove('hidden');
      elements.emptyState.classList.add('hidden');
      
      // Update word count
      updateWordCount();
      
      // Update notes list to highlight current note
      renderNotesList();
      
      // On mobile, close the sidebar after selecting a note
      if (window.innerWidth < 768) {
          elements.sidebar.classList.remove('active');
      }
  }
  
  // Close the current note
  function closeNote() {
      state.currentNoteId = null;
      state.unsavedChanges = false;
      elements.noteEditor.classList.add('hidden');
      
      if (state.notes.length === 0 && state.currentTab === 'all') {
          elements.emptyState.classList.remove('hidden');
      }
      
      renderNotesList();
  }
  
  // Save the current note
  function saveCurrentNote() {
      if (!state.currentNoteId || state.currentTab === 'trash') return;
      
      const note = state.notes.find(n => n.id === state.currentNoteId);
      if (!note) return;
      
      note.title = elements.noteTitle.value;
      note.content = elements.noteContent.innerHTML;
      note.lastModified = Date.now();
      
      saveNotes();
      state.unsavedChanges = false;
      
      elements.noteDate.textContent = `Terakhir diubah: ${formatDate(note.lastModified)}`;
      renderNotesList();
      
      showToast('Catatan disimpan', 'success');
  }
  
  // Mark note as having unsaved changes
  function markUnsaved() {
      state.unsavedChanges = true;
  }
  
  // Toggle pin status for current note
  function togglePinNote() {
      if (!state.currentNoteId || state.currentTab === 'trash') return;
      
      const note = state.notes.find(n => n.id === state.currentNoteId);
      if (!note) return;
      
      note.pinned = !note.pinned;
      note.lastModified = Date.now();
      
      elements.pinNoteBtn.innerHTML = note.pinned 
          ? '<i class="fas fa-star"></i>' 
          : '<i class="far fa-star"></i>';
      elements.pinNoteBtn.title = note.pinned ? 'Lepas pin' : 'Pin catatan';
      
      saveNotes();
      renderNotesList();
      
      showToast(note.pinned ? 'Catatan dipin' : 'Pin catatan dihapus', 'success');
  }
  
  // Toggle more menu
  function toggleMoreMenu() {
      elements.moreMenu.classList.toggle('hidden');
  }
  
  // Delete current note
  function deleteCurrentNote() {
      if (!state.currentNoteId) return;
      
      elements.moreMenu.classList.add('hidden');
      
      if (state.currentTab === 'trash') {
          // Permanently delete from trash
          showConfirmDialog(
              'Hapus Permanen',
              'Catatan akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.',
              () => {
                  const noteIndex = state.trashNotes.findIndex(n => n.id === state.currentNoteId);
                  if (noteIndex !== -1) {
                      state.trashNotes.splice(noteIndex, 1);
                      saveTrash();
                      closeNote();
                      showToast('Catatan dihapus permanen', 'success');
                  }
              },
              'Hapus Permanen'
          );
      } else {
          // Move to trash
          showConfirmDialog(
              'Hapus Catatan',
              'Catatan akan dipindahkan ke sampah.',
              () => {
                  const noteIndex = state.notes.findIndex(n => n.id === state.currentNoteId);
                  if (noteIndex !== -1) {
                      const note = state.notes.splice(noteIndex, 1)[0];
                      state.trashNotes.push({
                          ...note,
                          deletedAt: Date.now()
                      });
                      
                      saveNotes();
                      saveTrash();
                      closeNote();
                      
                      if (state.notes.length > 0) {
                          openNote(state.notes[0].id);
                      }
                      
                      showToast('Catatan dipindahkan ke sampah', 'success');
                  }
              },
              'Hapus'
          );
      }
  }
  
  // Restore note from trash
  function restoreNote(id) {
      const noteIndex = state.trashNotes.findIndex(n => n.id === id);
      if (noteIndex === -1) return;
      
      const note = state.trashNotes.splice(noteIndex, 1)[0];
      
      // Remove deletedAt property
      const { deletedAt, ...restNote } = note;
      
      // Add back to notes
      state.notes.unshift(restNote);
      
      saveNotes();
      saveTrash();
      
      // Update UI
      renderNotesList();
      
      showToast('Catatan dipulihkan', 'success');
  }
  
  // Check if a note is in trash
  function isNoteInTrash(id) {
      return state.trashNotes.some(n => n.id === id);
  }
  
  // Handle image upload
  function handleImageUpload(e) {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = function(event) {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.alt = 'Uploaded Image';
          img.className = 'my-2';
          
          // Insert at cursor position
          document.execCommand('insertHTML', false, img.outerHTML);
          markUnsaved();
      };
      
      reader.readAsDataURL(file);
      
      // Reset input
      e.target.value = '';
  }
  
  // Update word count
  function updateWordCount() {
      const text = elements.noteContent.textContent || '';
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      
      elements.noteWordcount.textContent = `${wordCount} kata`;
  }
  
  // Strip HTML tags from content
  function stripHtml(html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || '';
  }
  
  // Format date for display
  function formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Today
      if (date.toDateString() === now.toDateString()) {
          return `Hari ini, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      }
      
      // Yesterday
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
          return `Kemarin, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      }
      
      // This week (within 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      if (date > weekAgo) {
          const options = { weekday: 'long' };
          return date.toLocaleDateString('id-ID', options);
      }
      
      // Default format
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('id-ID', options);
  }
  
  // Show toast notification
  function showToast(message, type = 'success') {
      // Clear any existing timeout
      if (elements.toast.timeout) {
          clearTimeout(elements.toast.timeout);
      }
      
      elements.toast.textContent = message;
      elements.toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${type}`;
      
      // Auto hide after 3 seconds
      elements.toast.timeout = setTimeout(() => {
          elements.toast.classList.add('hidden');
      }, 3000);
  }
  
  // Show confirmation dialog
  function showConfirmDialog(title, message, onConfirm, confirmText = 'Hapus', onCancel = null, cancelText = 'Batal') {
      elements.confirmTitle.textContent = title;
      elements.confirmMessage.textContent = message;
      elements.confirmOk.textContent = confirmText;
      elements.confirmCancel.textContent = cancelText;
      
      // Set confirm callback
      elements.confirmOk.onclick = () => {
          onConfirm();
          elements.confirmModal.classList.add('hidden');
      };
      
      // Set cancel callback
      if (onCancel) {
          elements.confirmCancel.onclick = () => {
              onCancel();
              elements.confirmModal.classList.add('hidden');
          };
      } else {
          elements.confirmCancel.onclick = () => {
              elements.confirmModal.classList.add('hidden');
          };
      }
      
      // Show modal
      elements.confirmModal.classList.remove('hidden');
  }
  
  // Export all data
  function exportData() {
      const data = {
          notes: state.notes,
          trash: state.trashNotes,
          settings: state.settings,
          exportDate: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Show instruction for downloading
      showToast('Klik kanan pada link yang muncul dan pilih "Simpan sebagai..."', 'info');
      
      // Open in new tab
      window.open(url, '_blank');
      
      // Clean up URL object after a delay
      setTimeout(() => {
          URL.revokeObjectURL(url);
      }, 100);
  }
  
  // Handle import data
  function handleImportData(e) {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      if (file.type !== 'application/json') {
          showToast('File harus berformat JSON', 'error');
          return;
      }
      
      const reader = new FileReader();
      
      reader.onload = function(event) {
          try {
              const data = JSON.parse(event.target.result);
              
              // Validate data
              if (!data.notes || !Array.isArray(data.notes)) {
                  throw new Error('Format data tidak valid');
              }
              
              showConfirmDialog(
                  'Import Data',
                  'Data yang ada saat ini akan diganti dengan data yang diimport. Lanjutkan?',
                  () => {
                      // Import data
                      state.notes = data.notes || [];
                      state.trashNotes = data.trash || [];
                      
                      if (data.settings) {
                          state.settings = { ...state.settings, ...data.settings };
                      }
                      
                      // Save imported data
                      saveNotes();
                      saveTrash();
                      saveSettings();
                      
                      // Apply settings
                      applySettings();
                      
                      // Reset current note
                      state.currentNoteId = null;
                      state.unsavedChanges = false;
                      
                      // Update UI
                      renderUI();
                      
                      // Open first note if available
                      if (state.notes.length > 0) {
                          openNote(state.notes[0].id);
                      } else {
                          elements.noteEditor.classList.add('hidden');
                          elements.emptyState.classList.remove('hidden');
                      }
                      
                      // Close settings modal
                      elements.settingsModal.classList.add('hidden');
                      
                      showToast('Data berhasil diimport', 'success');
                  },
                  'Import'
              );
          } catch (err) {
              console.error('Error importing data:', err);
              showToast('Format file tidak valid', 'error');
          }
      };
      
      reader.readAsText(file);
      
      // Reset file input
      e.target.value = '';
  }
  
  // Confirm reset all data
  function confirmResetData() {
      showConfirmDialog(
          'Reset Semua Data',
          'Semua catatan dan pengaturan akan dihapus. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
          () => {
              // Clear all data
              state.notes = [];
              state.trashNotes = [];
              state.currentNoteId = null;
              state.unsavedChanges = false;
              
              // Save cleared data
              saveNotes();
              saveTrash();
              
              // Reset UI
              renderUI();
              elements.noteEditor.classList.add('hidden');
              
              // Close settings modal
              elements.settingsModal.classList.add('hidden');
              
              showToast('Semua data berhasil direset', 'success');
          },
          'Reset Data'
      );
  }
  
  // Initialize app
  init();
});