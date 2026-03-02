document.addEventListener("DOMContentLoaded", () => {
    const welcomeWrapper = document.getElementById("welcome-wrapper");
    const authScreen = document.getElementById("auth-screen");
    const getStartedBtn = document.getElementById("btn-get-started");
    const scrollSections = document.querySelectorAll(".scroll-section");
    const welcomeTitle = document.querySelector(".welcome-title");
    const welcomeSubtitle = document.querySelector(".welcome-subtitle");
    const backBtn = document.getElementById("btn-back-home");
    const canvas = document.getElementById("welcome-canvas");

    if (!welcomeWrapper) return; // Not on the welcome page (might be logged in)

    // Hide auth screen initially visually
    authScreen.style.opacity = "0";
    authScreen.style.pointerEvents = "none";

    // Disable body scrolling on auth screen until welcome is done?
    // Actually, body should scroll for the welcome animations.

    getStartedBtn.addEventListener("click", () => {
        // Fade out
        welcomeWrapper.style.opacity = "0";
        setTimeout(() => {
            welcomeWrapper.style.display = "none";
            // Show auth screen
            authScreen.style.opacity = "1";
            authScreen.style.pointerEvents = "auto";
            window.scrollTo(0, 0); // Reset scroll to top
        }, 800);
    });

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            // Fade out auth screen
            authScreen.style.opacity = "0";
            authScreen.style.pointerEvents = "none";
            setTimeout(() => {
                // Show welcome screen
                welcomeWrapper.style.display = "block";
                setTimeout(() => {
                    welcomeWrapper.style.opacity = "1";
                    window.scrollTo(0, 0); // Reset scroll to top
                }, 50);
            }, 800);
        });
    }

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        // 1. Title & Subtitle Fade Out (Scroll 0 -> 300)
        let titleOpacity = 1 - (scrollY / 300);
        let titleTranslate = -(scrollY * 0.2);

        if (titleOpacity < 0) titleOpacity = 0;

        welcomeTitle.style.opacity = titleOpacity;
        welcomeTitle.style.transform = `translateY(${titleTranslate}px)`;

        welcomeSubtitle.style.opacity = Math.max(0, 1 - (scrollY / 250));
        welcomeSubtitle.style.transform = `translateY(${-(scrollY * 0.1)}px)`;

        // Button fades out slightly slower
        getStartedBtn.style.opacity = Math.max(0, 1 - (scrollY / 400));
        getStartedBtn.style.pointerEvents = scrollY > 200 ? "none" : "auto";

        // 2. Scroll Sections Fade In (falling into place)
        scrollSections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            // Trigger when top of section is within 85% of viewport
            if (rect.top < windowHeight * 0.85 && rect.bottom > 0) {
                section.classList.add("visible");
            } else {
                // Optional: remove visible to replay animation if scrolled back up
                // section.classList.remove("visible"); 
            }
        });
    });

    // 3. Interactive Canvas Background (Dough-like Spring Grid)
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // Grid parameters
        const spacing = 60; // Distance between grid points
        let cols = Math.ceil(width / spacing) + 1;
        let rows = Math.ceil(height / spacing) + 1;

        let points = [];
        let mouse = { x: -1000, y: -1000, vx: 0, vy: 0, radius: 180, active: false };
        let lastMouse = { x: -1000, y: -1000 };

        // Initialize grid points
        function initGrid() {
            points = [];
            cols = Math.ceil(width / spacing) + 1;
            rows = Math.ceil(height / spacing) + 1;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    points.push({
                        x: i * spacing,
                        y: j * spacing,
                        originX: i * spacing,
                        originY: j * spacing,
                        vx: 0,
                        vy: 0,
                        // Spring constant (stiffness)
                        k: 0.05 + Math.random() * 0.02,
                        // Damping (how fast it settles)
                        damp: 0.85 + Math.random() * 0.05,
                        // Color intensity based on displacement
                        intensity: 0
                    });
                }
            }
        }
        initGrid();

        // Track mouse 
        document.addEventListener("mousemove", (e) => {
            lastMouse.x = mouse.x;
            lastMouse.y = mouse.y;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.vx = mouse.x - lastMouse.x;
            mouse.vy = mouse.y - lastMouse.y;
            mouse.active = true;
        });

        document.addEventListener("mouseleave", () => {
            mouse.active = false;
        });

        window.addEventListener("resize", () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initGrid();
        });

        // ── Gravitational Lensing for Text ──
        // Split text elements into individual character spans
        const lensRadius = 70; // Highly reduced: Just the area immediately around the cursor
        const lensStrength = 3; // Highly reduced: Barely nudges the letters 
        let charSpans = []; // { el, originX, originY }

        function splitTextNode(node) {
            // Recursively split text nodes into per-character spans
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (!text.trim() && text.indexOf(" ") === -1) return; // skip whitespace-only except for spaces between words

                const frag = document.createDocumentFragment();
                for (let ch of text) {
                    if (ch === '\n' || ch === '\r') continue;

                    if (ch === " ") {
                        // Use a native text node for spaces to preserve natural HTML word-wrapping and alignment
                        frag.appendChild(document.createTextNode(" "));
                    } else {
                        const span = document.createElement("span");
                        span.textContent = ch;
                        span.style.display = "inline-block";
                        span.style.transition = "none";
                        span.style.willChange = "transform";
                        span.className = "lens-char";
                        frag.appendChild(span);
                    }
                }
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Don't recurse into buttons or special elements
                if (node.tagName === "BUTTON" || node.id === "btn-get-started") return;
                // Iterate children in reverse to safely mutate
                const children = Array.from(node.childNodes);
                children.forEach(child => splitTextNode(child));
            }
        }

        // Split title and subtitle characters
        splitTextNode(welcomeTitle);
        splitTextNode(welcomeSubtitle);

        // Also split scroll section text
        scrollSections.forEach(section => splitTextNode(section));

        // Collect all lens-char spans after splitting
        function collectChars() {
            charSpans = [];
            document.querySelectorAll(".lens-char").forEach(span => {
                charSpans.push({ el: span, tx: 0, ty: 0 });
            });
        }
        collectChars();

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, width, height);

            // Allow velocity reading to slowly decay if mouse stops
            mouse.vx *= 0.9;
            mouse.vy *= 0.9;

            // 1. Update Physics Network
            for (let i = 0; i < points.length; i++) {
                let p = points[i];

                // Mouse Interaction (Dough deformation)
                if (mouse.active) {
                    let dx = mouse.x - p.x;
                    let dy = mouse.y - p.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < mouse.radius) {
                        let force = (mouse.radius - dist) / mouse.radius;
                        p.vx -= (dx / dist) * force * 1.5;
                        p.vy -= (dy / dist) * force * 1.5;
                        p.vx += mouse.vx * force * 0.05;
                        p.vy += mouse.vy * force * 0.05;
                        p.intensity = Math.min(1, p.intensity + force * 0.2);
                    }
                }

                // Spring back to origin
                let dxOrigin = p.originX - p.x;
                let dyOrigin = p.originY - p.y;
                p.vx += dxOrigin * p.k;
                p.vy += dyOrigin * p.k;

                p.vx *= p.damp;
                p.vy *= p.damp;

                p.x += p.vx;
                p.y += p.vy;

                p.intensity *= 0.96;
            }

            // 2. Draw Connections (Lines)
            ctx.lineWidth = 1;
            for (let j = 0; j < rows; j++) {
                ctx.beginPath();
                for (let i = 0; i < cols; i++) {
                    let p = points[i * rows + j];
                    if (i === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
                ctx.stroke();
            }
            for (let i = 0; i < cols; i++) {
                ctx.beginPath();
                for (let j = 0; j < rows; j++) {
                    let p = points[i * rows + j];
                    if (j === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
                ctx.stroke();
            }

            // 3. Draw Points
            for (let i = 0; i < points.length; i++) {
                let p = points[i];
                let distFromOrigin = Math.sqrt(Math.pow(p.x - p.originX, 2) + Math.pow(p.y - p.originY, 2));
                let stretchIntensity = Math.min(1, distFromOrigin / 30);
                let finalAlpha = Math.max(0.1, stretchIntensity * 0.8 + p.intensity * 0.5);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(232, 134, 58, ${finalAlpha})`;
                ctx.fill();
            }

            // 4. Gravitational Lensing on Text Characters
            if (mouse.active) {
                for (let i = 0; i < charSpans.length; i++) {
                    let c = charSpans[i];
                    const rect = c.el.getBoundingClientRect();
                    // Character center (viewport coords, matches fixed canvas)
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;

                    let dx = cx - mouse.x;
                    let dy = cy - mouse.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < lensRadius && dist > 1) {
                        // Gravitational lensing formula:
                        // deflection is strongest at a medium distance, falls off at edges
                        // Like 1/r but capped and smoothed
                        let t = dist / lensRadius; // 0 → 1
                        let deflection = lensStrength * (1 - t) * (1 - t) / (t + 0.15);
                        deflection = Math.min(deflection, lensStrength * 2);

                        // Push character radially outward from cursor
                        let nx = dx / dist;
                        let ny = dy / dist;

                        // Target displacement
                        let targetX = nx * deflection;
                        let targetY = ny * deflection;

                        // Smooth lerp toward target
                        c.tx += (targetX - c.tx) * 0.25;
                        c.ty += (targetY - c.ty) * 0.25;
                    } else {
                        // Spring back to origin
                        c.tx *= 0.85;
                        c.ty *= 0.85;
                    }

                    // Apply transform only if significant
                    if (Math.abs(c.tx) > 0.1 || Math.abs(c.ty) > 0.1) {
                        c.el.style.transform = `translate(${c.tx}px, ${c.ty}px)`;
                    } else {
                        c.tx = 0;
                        c.ty = 0;
                        c.el.style.transform = "";
                    }
                }
            } else {
                // Mouse left — ease everything back
                for (let i = 0; i < charSpans.length; i++) {
                    let c = charSpans[i];
                    c.tx *= 0.85;
                    c.ty *= 0.85;
                    if (Math.abs(c.tx) > 0.1 || Math.abs(c.ty) > 0.1) {
                        c.el.style.transform = `translate(${c.tx}px, ${c.ty}px)`;
                    } else {
                        c.tx = 0;
                        c.ty = 0;
                        c.el.style.transform = "";
                    }
                }
            }
        }
        animate();
    }
});
