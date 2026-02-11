(function () {
    var solarSystem = document.querySelector('.solar-system');
    var logo = document.querySelector('.logo');
    var center = { x: 450, y: 300 };

    // Planets in DOM order: п, л, а, н, е, т, а, р, й
    var planets = [
        { sel: '.btn-p',  a: 323, b: 190, speed: 0.20, dir:  1 },
        { sel: '.btn-l',  a: 255, b: 150, speed: 0.26, dir: -1 },
        { sel: '.btn-a1', a: 187, b: 110, speed: 0.34, dir:  1 },
        { sel: '.btn-n',  a: 289, b: 170, speed: 0.23, dir: -1 },
        { sel: '.btn-e',  a: 153, b: 90,  speed: 0.38, dir:  1 },
        { sel: '.btn-t',  a: 221, b: 130, speed: 0.30, dir: -1 },
        { sel: '.btn-a2', a: 119, b: 70,  speed: 0.44, dir:  1 },
        { sel: '.btn-r',  a: 85,  b: 50,  speed: 0.52, dir: -1 },
        { sel: '.btn-j',  a: 61,  b: 36,  speed: 0.62, dir:  1 },
    ];

    // Parade order: п л а н е т а р [и] й
    // 10 items total, logo at parade index 8
    var paradeSpacing = 52;
    var paradeCount = 10;
    var totalWidth = (paradeCount - 1) * paradeSpacing;
    var paradeStartX = center.x - totalWidth / 2;

    // paradeIndex => planet array index, -1 = logo
    var paradeMap = [0, 1, 2, 3, 4, 5, 6, 7, -1, 8];

    // Logo parade position
    var logoParadeX = paradeStartX + 8 * paradeSpacing;
    var logoParadeY = center.y;

    // Compute parade X for each planet
    var paradePositions = {};
    paradeMap.forEach(function (planetIdx, paradeIdx) {
        if (planetIdx !== -1) {
            paradePositions[planetIdx] = paradeStartX + paradeIdx * paradeSpacing;
        }
    });

    // Initialize
    planets.forEach(function (p, i) {
        p.el = document.querySelector(p.sel);
        p.angle = 0;
        p.paradeX = paradePositions[i];
        p.paradeY = center.y;
        p.x = p.paradeX;
        p.y = p.paradeY;
    });

    function render() {
        planets.forEach(function (p) {
            p.el.style.left = p.x + 'px';
            p.el.style.top = p.y + 'px';
            p.el.style.transform = 'translate(-50%, -50%)';
        });
    }

    // Place logo at parade position initially
    logo.style.left = logoParadeX + 'px';
    logo.style.top = logoParadeY + 'px';

    render();

    // Animation state
    var targetSpeed = 0;
    var currentSpeed = 0;
    var animating = false;
    var lastTime = 0;
    var orbitBlend = 0;
    var targetBlend = 0;

    // Logo blend (parade pos -> center)
    var logoX = logoParadeX;
    var logoY = logoParadeY;

    function tick(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (dt > 0.1) dt = 0.016;

        // Smooth speed
        if (targetSpeed > currentSpeed) {
            currentSpeed = Math.min(targetSpeed, currentSpeed + dt * 1.0);
        } else {
            currentSpeed = Math.max(0, currentSpeed - dt * 0.2);
        }

        // Smooth blend (parade <-> orbit)
        if (targetBlend > orbitBlend) {
            orbitBlend = Math.min(targetBlend, orbitBlend + dt * 0.8);
        } else {
            orbitBlend = Math.max(0, orbitBlend - dt * 0.15);
        }

        // Move logo between parade position and center
        logoX = logoParadeX + (center.x - logoParadeX) * orbitBlend;
        logoY = logoParadeY + (center.y - logoParadeY) * orbitBlend;
        logo.style.left = logoX + 'px';
        logo.style.top = logoY + 'px';

        planets.forEach(function (p) {
            p.angle += p.speed * p.dir * currentSpeed * dt;

            var orbitX = center.x + p.a * Math.cos(p.angle);
            var orbitY = center.y + p.b * Math.sin(p.angle);

            p.x = p.paradeX + (orbitX - p.paradeX) * orbitBlend;
            p.y = p.paradeY + (orbitY - p.paradeY) * orbitBlend;
        });

        render();

        if (currentSpeed > 0.001 || Math.abs(orbitBlend - targetBlend) > 0.001) {
            requestAnimationFrame(tick);
        } else {
            currentSpeed = 0;
            animating = false;
        }
    }

    function startAnimation() {
        targetSpeed = 1;
        targetBlend = 1;
        if (!animating) {
            animating = true;
            lastTime = 0;
            requestAnimationFrame(tick);
        }
    }

    function stopAnimation() {
        targetSpeed = 0;
        targetBlend = 0;
    }

    solarSystem.addEventListener('mouseenter', startAnimation);
    solarSystem.addEventListener('mouseleave', stopAnimation);
})();
