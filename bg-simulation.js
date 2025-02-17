/***********************************************
     * 1. THREE.JS BACKGROUND SCENE
     ***********************************************/
var scene, camera, renderer;
var clock;

var waterMesh, waterUniforms;
var cityGroup;
var turbinesGroup;
var cloudsGroup;
var cloudSpeed = 0.01;

// GRASS plane + uniforms
var grassMesh, grassUniforms;

// Water-related
var waterMesh, waterUniforms;

// Day-night cycle relted
var celestialBody, skyMesh, skyUniforms;
var isDay = true;
var transitionSpeed = 0.005;
var celestialTransitioning = false;

initThreeJS();
animate();

function initThreeJS() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 4, 20);
    scene.add(camera);

    // Renderer with full window size
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Give the background a nice sky color
    // renderer.setClearColor(0x87ceeb, 1);
    renderer.domElement.id = "threejs-canvas";
    document.body.appendChild(renderer.domElement);

    /******************************
    *  LIGHTING (Changes with Day/Night)
    ******************************/
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(0, 10, -20);
    scene.add(dirLight);

    /******************************
    *  SKYDOME (Fix for Full Coverage)
    ******************************/
    var skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    skyUniforms = {
        colorDay: { value: new THREE.Color(0x87ceeb) }, // Bright blue sky
        colorSunset: { value: new THREE.Color(0xffa07a) }, // Orange sunset
        colorNight: { value: new THREE.Color(0x1a1a40) }, // Dark blue night
        time: { value: 1.0 } // Transition between 1 (day) to 0 (night)
    };

    var skyVertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
            }
        `;

    var skyFragmentShader = `
            uniform vec3 colorDay;
            uniform vec3 colorSunset;
            uniform vec3 colorNight;
            uniform float time;
            void main() {
                vec3 color;
                if (time > 0.5) {
                    color = mix(colorSunset, colorDay, (time - 0.5) * 2.0); // Daytime transition
                } else {
                    color = mix(colorNight, colorSunset, time * 2.0); // Sunset to Night
                }
                gl_FragColor = vec4(color, 1.0);
            }
        `;

    var skyMaterial = new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        side: THREE.BackSide // Fix: Show inside of sphere
    });

    skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyMesh);

    /******************************
    *  CELESTIAL BODY (Acts as Sun & Moon)
    ******************************/
    var celestialGeometry = new THREE.SphereGeometry(2, 32, 32);
    var celestialMaterial = new THREE.MeshPhongMaterial({
        color: 0xffcc33, // Start as Sun (yellow)
        emissive: 0xffa500, // Glow effect
        shininess: 150
    });

    celestialBody = new THREE.Mesh(celestialGeometry, celestialMaterial);
    celestialBody.position.set(0, 25, -70); // Start at the top
    scene.add(celestialBody);

    /******************************
    *  WATER (Shader)
    ******************************/
    var waterGeometry = new THREE.PlaneBufferGeometry(50, 50, 100, 100);
    waterUniforms = {
        time: { type: 'f', value: 0.0 }
    };

    var waterVertexShader = `
        uniform float time;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec3 newPosition = position + normal * 0.2 * sin( (position.x + position.y) * 2.0 + time * 3.0 );
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `;

    var waterFragmentShader = `
        uniform float time;
        varying vec2 vUv;
        void main() {
            float wave = sin(vUv.x * 10.0 + time * 2.0) * 0.05;
            gl_FragColor = vec4(0.0, 0.5 + wave, 0.7 + wave, 0.6);
        }
    `;

    var waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        side: THREE.DoubleSide,
        transparent: true
    });

    waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, -2, -30);
    scene.add(waterMesh);

    /******************************
    *  GRASS PLANE
    ******************************/
    var grassGeometry = new THREE.PlaneBufferGeometry(50, 50, 50, 50);
    grassUniforms = { time: { type: 'f', value: 0.0 } };

    var grassVertexShader = [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  vec3 newPosition = position;",
        "  float distZ = 25.0 - newPosition.z;",
        "  float factor = 0.008;",
        "  newPosition.y += factor * distZ * distZ;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);",
        "}"
    ].join("\n");

    var grassFragmentShader = [
        "void main() {",
        "  gl_FragColor = vec4(0.2, 0.8, 0.2, 1.0);",
        "}"
    ].join("\n");

    var grassMaterial = new THREE.ShaderMaterial({
        uniforms: grassUniforms,
        vertexShader: grassVertexShader,
        fragmentShader: grassFragmentShader,
        side: THREE.DoubleSide
    });

    grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.set(1, -1, -25);
    scene.add(grassMesh);

    /******************************
     *  WATER (Shader)
     ******************************/
    var waterGeometry = new THREE.PlaneBufferGeometry(50, 50, 100, 100);
    waterUniforms = {
        time: { type: 'f', value: 0.0 }
    };

    var waterVertexShader = [
        "uniform float time;",
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  vec3 newPosition = position + normal * 0.2 * sin( (position.x + position.y) * 2.0 + time * 3.0 );",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);",
        "}"
    ].join("\n");

    var waterFragmentShader = [
        "uniform float time;",
        "varying vec2 vUv;",
        "void main() {",
        "  float wave = sin(vUv.x * 10.0 + time * 2.0) * 0.05;",
        "  gl_FragColor = vec4(0.0, 0.5 + wave, 0.7 + wave, 0.6);",
        "}"
    ].join("\n");

    var waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        side: THREE.DoubleSide,
        transparent: true
    });

    waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, -2, 11);
    scene.add(waterMesh);

    /******************************
     *  WIND TURBINES
     ******************************/
    turbinesGroup = new THREE.Group();
    var turbinePoleGeom = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    var turbinePoleMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var bladeGeom = new THREE.BoxGeometry(0.8, 0.02, 0.1);
    var bladeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });

    for (var t = 0; t < 3; t++) {
        var turbine = new THREE.Group();
        var pole = new THREE.Mesh(turbinePoleGeom, turbinePoleMat);
        pole.position.y = 1;
        turbine.add(pole);

        var bladeGroup = new THREE.Group();
        bladeGroup.position.y = 2;
        for (var b = 0; b < 3; b++) {
            var blade = new THREE.Mesh(bladeGeom, bladeMat);
            blade.rotation.z = (Math.PI * 2 / 3) * b;
            bladeGroup.add(blade);
        }
        turbine.add(bladeGroup);

        turbine.position.x = t * 2 - 2;
        turbine.position.z = -5;
        turbinesGroup.add(turbine);
    }
    scene.add(turbinesGroup);

    /******************************
     *  CITY SKYLINE
     ******************************/
    cityGroup = new THREE.Group();
    var glassColors = [0x68a3d5, 0x4d8bcc, 0x7cb7e4, 0x87a7cf];

    for (var c = 0; c < 10; c++) {
        var bHeight = Math.random() * 5 + 3;
        var bWidth = Math.random() * 1 + 0.5;
        var boxGeom = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
        var boxMat = new THREE.MeshPhongMaterial({
            color: glassColors[Math.floor(Math.random() * glassColors.length)],
            shininess: 100,
            reflectivity: 0.8
        });
        var box = new THREE.Mesh(boxGeom, boxMat);

        var xSpacing = c * 2 - 10;
        var zPosition = -11;

        var curveFactor = 0.008;
        var distZ = zPosition - (-9.5);
        var grassY = curveFactor * distZ * distZ;
        box.position.set(xSpacing, grassY + bHeight / 2, zPosition);
        cityGroup.add(box);
    }
    scene.add(cityGroup);

    /******************************
     *  CLOUDS
     ******************************/
    cloudsGroup = new THREE.Group();

    var cloudPositions = [
        { x: -15, z: -3 },
        { x: -10, z: -8 },
        { x: -5, z: -12 },
        { x: 5, z: -10 },
        { x: 10, z: -7 }
    ];

    for (var i = 0; i < cloudPositions.length; i++) {
        var planeGeom = new THREE.BoxGeometry(0.7, 0.2, 0.7);
        var planeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        var planeMesh = new THREE.Mesh(planeGeom, planeMat);

        var randomY = Math.random() * 4 + 10;

        planeMesh.position.set(cloudPositions[i].x, randomY, cloudPositions[i].z);
        planeMesh.scale.set(2, 2, 2); // Keep all clouds the same size

        cloudsGroup.add(planeMesh);
    }
    scene.add(cloudsGroup);

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    updateDayNightCycle();
    renderScene();
}

function updateDayNightCycle() {
    var speed = 0.007; // Speed of sun/moon movement
    celestialBody.position.y -= speed;

    // Smoothly transition sky color
    if (isDay) {
        skyUniforms.time.value = Math.min(1.0, skyUniforms.time.value + transitionSpeed);
    } else {
        skyUniforms.time.value = Math.max(0.0, skyUniforms.time.value - transitionSpeed);
    }

    // 🌅 **HIDE BEHIND GRASS BEFORE SWITCHING**
    if (celestialBody.position.y < -3 && !celestialTransitioning) {
        celestialTransitioning = true; // Prevents multiple triggers

        setTimeout(() => {
            if (isDay) {
                // Switch to Moon
                celestialBody.material.color.set(0x8a9ba8); // Gray-blue
                celestialBody.material.emissive.set(0x556677); // Dim glow
            } else {
                // Switch back to Sun
                celestialBody.material.color.set(0xffcc33); // Bright yellow
                celestialBody.material.emissive.set(0xffa500); // Sun glow
            }

            celestialBody.position.y = 15; // Move it back up
            isDay = !isDay;
            celestialTransitioning = false; // Allow next transition
        }, 500); // Short delay for realism
    }

    // ✅ Ensure the sky follows the camera (fixes culling issue)
    skyMesh.position.copy(camera.position);
}

function renderScene() {
    var delta = clock.getDelta();

    // Animate water
    waterUniforms.time.value += delta;

    for (var i = 0; i < cloudsGroup.children.length; i++) {
        var cloud = cloudsGroup.children[i];
        cloud.position.x += cloudSpeed;

        if (cloud.position.x > 20) {
            cloud.position.x = -20;
        }
    }

    // Turbine blades
    for (var i = 0; i < turbinesGroup.children.length; i++) {
        var turbine = turbinesGroup.children[i];
        var bladeGroup = turbine.children[1];
        bladeGroup.rotation.z += delta * 2;
    }

    renderer.render(scene, camera);
}