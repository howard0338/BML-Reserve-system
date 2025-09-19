// 儀器預約系統 JavaScript

class InstrumentBookingSystem {
    constructor() {
        this.instruments = [];
        this.bookings = [];
        this.currentWeekOffset = 0;
        this.selectedInstrument = null;
        this.editingBooking = null;
        this.editingInstrument = null;
        this.user = null;
        this.isFirebaseReady = false;
        
        this.init();
    }

    // 初始化系統
    init() {
        this.setupEventListeners();
        this.initFirebase();
    }

    // 初始化Firebase
    async initFirebase() {
        console.log('🔄 等待Firebase準備...');
        this.updateConnectionStatus('connecting', '連線中...');
        
        // 監聽Firebase準備事件
        window.addEventListener('firebaseReady', () => {
            console.log('✅ Firebase已準備就緒');
            this.isFirebaseReady = true;
            this.updateConnectionStatus('connected', '已連線');
            this.loadDataFromFirebase();
            this.setupRealtimeListeners();
            this.showMessage('已連接到Firebase Realtime Database', 'success');
        });
    }

    // 設置即時監聽器
    setupRealtimeListeners() {
        if (!window.firebase) {
            console.error('Firebase未載入');
            return;
        }

        const { listenToReservations, listenToInstruments } = window.firebase;
        
        // 監聽預約資料變化
        this.unsubscribeReservations = listenToReservations((data) => {
            console.log('📊 預約資料已更新:', data);
            if (data) {
                this.bookings = data;
                this.renderSchedule();
            }
        });
        
        // 監聽儀器資料變化
        this.unsubscribeInstruments = listenToInstruments((data) => {
            console.log('🔧 儀器資料已更新:', data);
            if (data) {
                this.instruments = data;
                this.renderInstruments();
            }
        });
    }

    // 從Firebase載入資料
    async loadDataFromFirebase() {
        if (!window.firebase) {
            console.error('Firebase未載入');
            return;
        }

        const { readInstruments, readAllReservations } = window.firebase;
        
        try {
            // 載入儀器資料
            const instrumentsData = await readInstruments();
            if (instrumentsData) {
                this.instruments = Object.values(instrumentsData);
                this.renderInstruments();
                console.log('✅ 儀器資料已載入');
            } else {
                console.log('📝 沒有儀器資料，使用預設資料');
                this.instruments = this.getDefaultInstruments();
                this.saveInstruments();
            }
            
            // 載入預約資料
            const bookingsData = await readAllReservations();
            if (bookingsData) {
                this.bookings = Object.values(bookingsData);
                this.renderSchedule();
                console.log('✅ 預約資料已載入');
            } else {
                console.log('📝 沒有預約資料，初始化空資料');
                this.bookings = [];
            }
        } catch (error) {
            console.error('❌ 載入資料失敗:', error);
        }
    }

    // 從本地儲存載入資料（備用）
    loadDataFromLocalStorage() {
        console.log('⚠️ 使用本地儲存作為備用');
        this.instruments = this.loadInstruments();
        this.bookings = this.loadBookings();
        this.renderInstruments();
        this.renderSchedule();
        this.checkWeeklyReset();
    }

    // 更新連線狀態
    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.className = `connection-status ${status}`;
            const textElement = statusElement.querySelector('span');
            if (textElement) {
                textElement.textContent = text;
            }
        }
        console.log(`🔗 連線狀態: ${text}`);
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 儀器相關
        document.getElementById('addInstrumentBtn').addEventListener('click', () => this.showAddInstrumentModal());
        document.getElementById('saveInstrument').addEventListener('click', () => this.saveInstrument());
        document.getElementById('cancelAddInstrument').addEventListener('click', () => this.hideModal('addInstrumentModal'));
        document.getElementById('deleteInstrument').addEventListener('click', () => this.deleteInstrument());

        // 預約相關
        document.getElementById('saveBooking').addEventListener('click', () => this.saveBooking());
        document.getElementById('cancelBooking').addEventListener('click', () => this.hideModal('bookingModal'));
        document.getElementById('deleteBooking').addEventListener('click', () => this.deleteBooking());

        // 歷史記錄
        document.getElementById('viewHistoryBtn').addEventListener('click', () => this.showHistoryModal());
        document.getElementById('filterHistory').addEventListener('click', () => this.filterHistory());

        // 週次導航
        document.getElementById('prevWeekBtn').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeekBtn').addEventListener('click', () => this.navigateWeek(1));

        // 模態框關閉
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // 點擊模態框外部關閉
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // 載入儀器資料（本地備用）
    loadInstruments() {
        const saved = localStorage.getItem('instruments');
        if (saved) {
            return JSON.parse(saved);
        }
        return this.getDefaultInstruments();
    }

    // 載入預約資料（本地備用）
    loadBookings() {
        const saved = localStorage.getItem('bookings');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    // 預設儀器
    getDefaultInstruments() {
        return [
            {
                id: 1,
                name: '電子顯微鏡',
                description: '高解析度電子顯微鏡，適用於材料分析',
                location: '實驗室A-101'
            },
            {
                id: 2,
                name: 'X射線繞射儀',
                description: '用於晶體結構分析',
                location: '實驗室A-102'
            },
            {
                id: 3,
                name: '原子力顯微鏡',
                description: '表面形貌分析儀器',
                location: '實驗室A-103'
            },
            {
                id: 4,
                name: '拉曼光譜儀',
                description: '分子振動光譜分析',
                location: '實驗室B-201'
            }
        ];
    }

    // 儲存儀器資料到Firebase
    async saveInstruments() {
        if (window.firebase) {
            try {
                const { writeInstruments } = window.firebase;
                await writeInstruments(this.instruments);
                console.log('✅ 儀器資料已儲存到Firebase');
            } catch (error) {
                console.error('❌ 儲存儀器資料失敗:', error);
            }
        } else {
            console.error('Firebase未載入');
        }
    }

    // 儲存預約資料到Firebase
    async saveBookings() {
        if (window.firebase) {
            try {
                const { writeReservation } = window.firebase;
                // 儲存最新的預約
                if (this.bookings.length > 0) {
                    const latestBooking = this.bookings[this.bookings.length - 1];
                    await writeReservation(latestBooking);
                    console.log('✅ 預約資料已儲存到Firebase');
                }
            } catch (error) {
                console.error('❌ 儲存預約資料失敗:', error);
            }
        } else {
            console.error('Firebase未載入');
        }
    }

    // 渲染儀器列表
    renderInstruments() {
        const container = document.getElementById('instrumentsList');
        container.innerHTML = '';

        this.instruments.forEach(instrument => {
            const instrumentElement = document.createElement('div');
            instrumentElement.className = 'instrument-item draggable';
            instrumentElement.dataset.instrumentId = instrument.id;
            instrumentElement.draggable = true;
            
            instrumentElement.innerHTML = `
                <div class="instrument-content">
                    <h3>${instrument.name}</h3>
                    <p>${instrument.description}</p>
                    <div class="instrument-location">📍 ${instrument.location}</div>
                </div>
                <div class="instrument-actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); bookingSystem.editInstrument(${instrument.id})" title="編輯儀器">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;

            // 拖曳事件
            instrumentElement.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, instrument);
            });

            instrumentElement.addEventListener('click', () => {
                this.selectInstrument(instrument.id);
            });

            container.appendChild(instrumentElement);
        });
    }

    // 選擇儀器
    selectInstrument(instrumentId) {
        // 移除所有active類別
        document.querySelectorAll('.instrument-item').forEach(item => {
            item.classList.remove('active');
        });

        // 添加active類別到選中的儀器
        const selectedItem = document.querySelector(`[data-instrument-id="${instrumentId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.selectedInstrument = instrumentId;
        this.renderSchedule();
    }

    // 處理拖曳開始
    handleDragStart(e, instrument) {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            instrumentId: instrument.id,
            instrumentName: instrument.name
        }));
        e.dataTransfer.effectAllowed = 'move';
        
        // 添加拖曳視覺效果
        e.target.style.opacity = '0.5';
        
        // 拖曳結束時恢復透明度
        setTimeout(() => {
            e.target.style.opacity = '1';
        }, 0);
    }

    // 處理拖放
    handleDrop(e, slot) {
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const instrumentId = data.instrumentId;
            const instrumentName = data.instrumentName;
            
            // 檢查該儀器是否已在同一時段預約
            const existingBooking = this.bookings.find(b => 
                b.date === slot.dataset.date && 
                b.time === slot.dataset.time && 
                b.instrumentId === instrumentId
            );
            
            if (existingBooking) {
                this.showMessage('該儀器在此時段已有預約', 'error');
                return;
            }
            
            // 顯示預約表單
            this.showBookingModal(
                instrumentId,
                slot.dataset.date,
                slot.dataset.time
            );
            
        } catch (error) {
            console.error('拖放處理錯誤:', error);
            this.showMessage('拖放失敗，請重試', 'error');
        }
    }

    // 渲染排程表格
    renderSchedule() {
        this.renderCurrentWeekSchedule();
        this.renderNextWeekSchedule();
        this.updateWeekDisplay();
    }

    // 渲染本週排程
    renderCurrentWeekSchedule() {
        const container = document.getElementById('currentWeekSchedule');
        const weekStart = this.getWeekStart(0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekTitle = `本週 (${weekStart.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} - ${weekEnd.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })})`;
        container.innerHTML = `<div class="week-title">${weekTitle}</div>` + this.generateScheduleTable(weekStart, 'current');
    }

    // 渲染下週排程
    renderNextWeekSchedule() {
        const container = document.getElementById('nextWeekSchedule');
        const weekStart = this.getWeekStart(1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekTitle = `下週 (${weekStart.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} - ${weekEnd.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })})`;
        container.innerHTML = `<div class="week-title">${weekTitle}</div>` + this.generateScheduleTable(weekStart, 'next');
    }

    // 生成排程表格
    generateScheduleTable(weekStart, weekType) {
        const timeSlots = ['上午', '下午', '晚上'];
        
        const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
        const dayDates = days.map((_, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            return date;
        });

        let tableHTML = `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>時間</th>
                        ${days.map((day, index) => 
                            `<th>${day}<br><small>${dayDates[index].toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}</small></th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        timeSlots.forEach(timeSlot => {
            tableHTML += '<tr>';
            tableHTML += `<td><strong>${timeSlot}</strong></td>`;
            
            days.forEach((_, dayIndex) => {
                const date = dayDates[dayIndex];
                const dateStr = date.toISOString().split('T')[0];
                const bookings = this.bookings.filter(b => b.date === dateStr && b.time === timeSlot);
                
                let cellContent = '';
                if (bookings.length > 0) {
                    const bookingItems = bookings.map(booking => {
                        const instrument = this.instruments.find(i => i.id === booking.instrumentId);
                        return `
                            <div class="booking-item" data-booking-id="${booking.id}">
                                <strong>${instrument ? instrument.name : '未知儀器'}</strong><br>
                                <small>${booking.user}</small>
                            </div>
                        `;
                    }).join('');
                    
                    cellContent = `
                        <div class="time-slot booked" data-date="${dateStr}" data-time="${timeSlot}" data-week="${weekType}">
                            ${bookingItems}
                        </div>
                    `;
                } else {
                    cellContent = `
                        <div class="time-slot drop-zone" data-date="${dateStr}" data-time="${timeSlot}" data-week="${weekType}">
                            可預約
                        </div>
                    `;
                }
                
                tableHTML += `<td>${cellContent}</td>`;
            });
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';

        // 添加點擊事件監聽器
        setTimeout(() => {
            this.attachScheduleEventListeners(weekType);
        }, 100);

        return tableHTML;
    }

    // 附加排程事件監聽器
    attachScheduleEventListeners(weekType) {
        const container = weekType === 'current' ? 
            document.getElementById('currentWeekSchedule') : 
            document.getElementById('nextWeekSchedule');

        // 可預約時段拖放事件
        container.querySelectorAll('.time-slot.drop-zone').forEach(slot => {
            // 拖放事件
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', (e) => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                this.handleDrop(e, slot);
            });

            // 點擊事件（備用）
            slot.addEventListener('click', (e) => {
                if (!this.selectedInstrument) {
                    this.showMessage('請先選擇儀器或拖曳儀器到此處', 'error');
                    return;
                }
                this.showBookingModal(
                    this.selectedInstrument,
                    slot.dataset.date,
                    slot.dataset.time
                );
            });
        });

        // 已預約時段點擊事件
        container.querySelectorAll('.booking-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookingId = parseInt(item.dataset.bookingId);
                this.editBooking(bookingId);
            });
        });
    }

    // 更新週次顯示
    updateWeekDisplay() {
        const weekStart = this.getWeekStart(0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const display = document.getElementById('currentWeekDisplay');
        display.textContent = `本週與下週排程`;
    }

    // 獲取週次開始日期
    getWeekStart(weekOffset) {
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // 週日調整為週一
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
        return weekStart;
    }

    // 週次導航
    navigateWeek(direction) {
        this.currentWeekOffset += direction;
        this.renderSchedule();
    }


    // 顯示新增儀器模態框
    showAddInstrumentModal() {
        this.editingInstrument = null;
        document.getElementById('instrumentModalTitle').textContent = '新增儀器';
        document.getElementById('addInstrumentForm').reset();
        document.getElementById('deleteInstrument').style.display = 'none';
        this.showModal('addInstrumentModal');
    }

    // 編輯儀器
    editInstrument(instrumentId) {
        const instrument = this.instruments.find(i => i.id === instrumentId);
        if (!instrument) return;

        this.editingInstrument = instrument;
        document.getElementById('instrumentModalTitle').textContent = '編輯儀器';
        document.getElementById('instrumentName').value = instrument.name;
        document.getElementById('instrumentDescription').value = instrument.description;
        document.getElementById('instrumentLocation').value = instrument.location;
        document.getElementById('deleteInstrument').style.display = 'inline-block';
        this.showModal('addInstrumentModal');
    }

    // 儲存儀器
    saveInstrument() {
        const name = document.getElementById('instrumentName').value.trim();
        const description = document.getElementById('instrumentDescription').value.trim();
        const location = document.getElementById('instrumentLocation').value.trim();

        if (!name) {
            this.showMessage('請輸入儀器名稱', 'error');
            return;
        }

        if (this.editingInstrument) {
            // 更新現有儀器
            this.editingInstrument.name = name;
            this.editingInstrument.description = description;
            this.editingInstrument.location = location;
            this.showMessage('儀器更新成功！', 'success');
        } else {
            // 新增儀器
            const newInstrument = {
                id: Date.now(),
                name,
                description,
                location
            };
            this.instruments.push(newInstrument);
            this.showMessage('儀器新增成功！', 'success');
        }

        this.saveInstruments();
        this.renderInstruments();
        this.hideModal('addInstrumentModal');
    }

    // 刪除儀器
    deleteInstrument() {
        if (!this.editingInstrument) return;

        // 檢查是否有相關預約
        const hasBookings = this.bookings.some(b => b.instrumentId === this.editingInstrument.id);
        if (hasBookings) {
            this.showMessage('無法刪除有預約記錄的儀器', 'error');
            return;
        }

        if (confirm(`確定要刪除儀器「${this.editingInstrument.name}」嗎？`)) {
            this.instruments = this.instruments.filter(i => i.id !== this.editingInstrument.id);
            this.saveInstruments();
            this.renderInstruments();
            this.hideModal('addInstrumentModal');
            this.showMessage('儀器已刪除', 'success');
        }
    }

    // 顯示預約模態框
    showBookingModal(instrumentId, date, time) {
        this.editingBooking = null;
        
        // 填充儀器選項
        const instrumentSelect = document.getElementById('bookingInstrument');
        instrumentSelect.innerHTML = '';
        this.instruments.forEach(instrument => {
            const option = document.createElement('option');
            option.value = instrument.id;
            option.textContent = instrument.name;
            if (instrument.id === instrumentId) {
                option.selected = true;
            }
            instrumentSelect.appendChild(option);
        });

        // 填充表單
        document.getElementById('bookingUser').value = '';
        document.getElementById('bookingDate').value = date;
        document.getElementById('bookingTime').value = time;
        document.getElementById('bookingPurpose').value = '';

        // 隱藏刪除按鈕
        document.getElementById('deleteBooking').style.display = 'none';

        this.showModal('bookingModal');
    }

    // 編輯預約
    editBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        this.editingBooking = booking;

        // 填充儀器選項
        const instrumentSelect = document.getElementById('bookingInstrument');
        instrumentSelect.innerHTML = '';
        this.instruments.forEach(instrument => {
            const option = document.createElement('option');
            option.value = instrument.id;
            option.textContent = instrument.name;
            if (instrument.id === booking.instrumentId) {
                option.selected = true;
            }
            instrumentSelect.appendChild(option);
        });

        // 填充表單
        document.getElementById('bookingUser').value = booking.user;
        document.getElementById('bookingDate').value = booking.date;
        document.getElementById('bookingTime').value = booking.time;
        document.getElementById('bookingPurpose').value = booking.purpose || '';

        // 顯示刪除按鈕
        document.getElementById('deleteBooking').style.display = 'inline-block';

        this.showModal('bookingModal');
    }

    // 儲存預約
    saveBooking() {
        const instrumentId = parseInt(document.getElementById('bookingInstrument').value);
        const user = document.getElementById('bookingUser').value.trim();
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const purpose = document.getElementById('bookingPurpose').value.trim();

        if (!user) {
            this.showMessage('請輸入預約人姓名', 'error');
            return;
        }

        // 檢查該儀器是否已在同一時段預約（編輯時排除自己）
        const existingBooking = this.bookings.find(b => 
            b.date === date && 
            b.time === time && 
            b.instrumentId === instrumentId &&
            b.id !== this.editingBooking?.id
        );

        if (existingBooking) {
            this.showMessage('該儀器在此時段已有預約', 'error');
            return;
        }

        if (this.editingBooking) {
            // 更新現有預約
            this.editingBooking.instrumentId = instrumentId;
            this.editingBooking.user = user;
            this.editingBooking.date = date;
            this.editingBooking.time = time;
            this.editingBooking.purpose = purpose;
            this.editingBooking.updatedAt = new Date().toISOString();
        } else {
            // 新增預約
            const newBooking = {
                id: Date.now(),
                instrumentId,
                user,
                date,
                time,
                purpose,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.bookings.push(newBooking);
        }

        this.saveBookings();
        this.renderSchedule();
        this.hideModal('bookingModal');
        this.showMessage(this.editingBooking ? '預約更新成功！' : '預約成功！', 'success');
    }

    // 刪除預約
    deleteBooking() {
        if (!this.editingBooking) return;

        if (confirm('確定要刪除此預約嗎？')) {
            this.bookings = this.bookings.filter(b => b.id !== this.editingBooking.id);
            this.saveBookings();
            this.renderSchedule();
            this.hideModal('bookingModal');
            this.showMessage('預約已刪除', 'success');
        }
    }

    // 顯示歷史記錄模態框
    showHistoryModal() {
        this.renderHistory();
        this.populateHistoryFilters();
        this.showModal('historyModal');
    }

    // 填充歷史記錄篩選器
    populateHistoryFilters() {
        const instrumentFilter = document.getElementById('historyInstrumentFilter');
        instrumentFilter.innerHTML = '<option value="">所有儀器</option>';
        
        this.instruments.forEach(instrument => {
            const option = document.createElement('option');
            option.value = instrument.id;
            option.textContent = instrument.name;
            instrumentFilter.appendChild(option);
        });
    }

    // 渲染歷史記錄
    renderHistory(filteredBookings = null) {
        const bookings = filteredBookings || this.bookings;
        const container = document.getElementById('historyContent');
        
        if (bookings.length === 0) {
            container.innerHTML = '<p>沒有找到預約記錄</p>';
            return;
        }

        // 按日期排序（最新的在前）
        const sortedBookings = bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedBookings.map(booking => {
            const instrument = this.instruments.find(i => i.id === booking.instrumentId);
            const date = new Date(booking.date);
            
            return `
                <div class="history-item">
                    <div class="history-item-info">
                        <h4>${instrument ? instrument.name : '未知儀器'}</h4>
                        <p><strong>預約人：</strong>${booking.user}</p>
                        <p><strong>日期：</strong>${date.toLocaleDateString('zh-TW')}</p>
                        <p><strong>時間：</strong>${booking.time}</p>
                        ${booking.purpose ? `<p><strong>用途：</strong>${booking.purpose}</p>` : ''}
                        <p><strong>建立時間：</strong>${new Date(booking.createdAt).toLocaleString('zh-TW')}</p>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn btn-primary" onclick="bookingSystem.editBooking(${booking.id})">
                            <i class="fas fa-edit"></i> 編輯
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 篩選歷史記錄
    filterHistory() {
        const instrumentId = document.getElementById('historyInstrumentFilter').value;
        const dateFrom = document.getElementById('historyDateFrom').value;
        const dateTo = document.getElementById('historyDateTo').value;

        let filteredBookings = this.bookings;

        if (instrumentId) {
            filteredBookings = filteredBookings.filter(b => b.instrumentId === parseInt(instrumentId));
        }

        if (dateFrom) {
            filteredBookings = filteredBookings.filter(b => b.date >= dateFrom);
        }

        if (dateTo) {
            filteredBookings = filteredBookings.filter(b => b.date <= dateTo);
        }

        this.renderHistory(filteredBookings);
    }

    // 檢查週次重置
    checkWeeklyReset() {
        const today = new Date();
        const lastReset = localStorage.getItem('lastWeeklyReset');
        const lastResetDate = lastReset ? new Date(lastReset) : null;

        // 如果是週日且距離上次重置超過6天，則執行重置
        if (today.getDay() === 0 && (!lastResetDate || (today - lastResetDate) > 6 * 24 * 60 * 60 * 1000)) {
            this.performWeeklyReset();
            localStorage.setItem('lastWeeklyReset', today.toISOString());
        }
    }

    // 執行週次重置
    performWeeklyReset() {
        // 這裡可以添加週次重置的邏輯
        // 例如：隱藏當週排程，顯示下下週排程等
        this.showMessage('系統已自動更新為下週排程', 'info');
    }

    // 顯示模態框
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // 隱藏模態框
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 顯示訊息
    showMessage(message, type = 'info') {
        // 移除現有訊息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 創建新訊息
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // 插入到頁面頂部
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // 3秒後自動移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// 初始化系統
let bookingSystem;
document.addEventListener('DOMContentLoaded', () => {
    bookingSystem = new InstrumentBookingSystem();
});
