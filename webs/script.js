fetch('/bot/announcements.json')
    .then(res => res.json())
    .then(data => {
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const weekGroups = {};
        const weekAnchors = {};

        // 基準日設為 7/16
        const baseStart = new Date('2025-07-16T00:00:00');
        baseStart.setHours(0, 0, 0, 0); // 確保整點

        data.forEach(msg => {
            const time = new Date(msg.timestamp);
            const diffDays = Math.floor((time - baseStart) / (1000 * 60 * 60 * 24));
            const groupIndex = Math.floor(diffDays / 7);

            const groupStart = new Date(baseStart);
            groupStart.setDate(baseStart.getDate() + groupIndex * 7);
            const weekKey = groupStart.toISOString().split('T')[0];

            if (!weekGroups[weekKey]) weekGroups[weekKey] = [];
            weekGroups[weekKey].push(msg);
        });

        const btnContainer = document.createElement('div');
        btnContainer.style.marginBottom = '16px';

        const container = document.getElementById('announcements');
        container.innerHTML = '';

        Object.entries(weekGroups).forEach(([weekKey, messages]) => {
            const start = new Date(weekKey);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);

            const label = `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;
            const anchorId = `week-${weekKey}`;
            weekAnchors[weekKey] = anchorId;

            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.margin = '4px';
            btn.onclick = () => {
                container.innerHTML = '';

                const div = document.createElement('div');
                div.id = anchorId;

                const merged = [];
                messages.forEach(msg => {
                    const last = merged[merged.length - 1];
                    const currentTime = new Date(msg.timestamp);
                    const cleanedContent = msg.content;

                    if (
                        last &&
                        last.author === msg.author &&
                        (currentTime - new Date(last.lastTimestamp)) / 1000 <= 300
                    ) {
                        last.content += `<br>${cleanedContent}`;
                        last.lastTimestamp = msg.timestamp;
                        if (msg.images && msg.images.length > 0) {
                            last.images = Array.from(new Set([...last.images, ...msg.images]));
                        }
                    } else {
                        merged.push({
                            author: msg.author,
                            content: cleanedContent,
                            lastTimestamp: msg.timestamp,
                            images: msg.images || []
                        });
                    }
                });

                merged.forEach(msg => {
                    const item = document.createElement('div');
                    const formattedTime = new Date(msg.lastTimestamp).toLocaleString();

                    let html = `<strong>${msg.author}</strong>: ${msg.content}<br><small>${formattedTime}</small><br>`;
                    msg.images.forEach(url => {
                        html += `
                        <div style="margin-top: 8px;">
                          <img 
                            src="${url}" 
                            alt="公告圖片" 
                            style="max-width: 100%; border-radius: 6px;" 
                            onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<div style=\'color:red;\'>❌ 圖片已失效</div>')" 
                          />
                        </div>
                      `;
                    });
                    html += `<hr>`;
                    item.innerHTML = html;
                    div.appendChild(item);
                });


                container.appendChild(div);
                div.scrollIntoView({
                    behavior: 'smooth'
                });
            };

            btnContainer.appendChild(btn);
        });

        container.parentNode.insertBefore(btnContainer, container);
    })
    .catch(err => {
        console.error('載入公告失敗:', err);
    });