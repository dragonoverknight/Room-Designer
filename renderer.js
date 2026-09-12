import * as graphics from 'three';

// Create a scene, camera, and renderer

const scene = new graphics.Scene();
const camera = new graphics.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new graphics.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// create new components for the scene
class Floor extends graphics.Group {
    constructor(width, depth) {
        super();
        const floorGeometry = new graphics.PlaneGeometry(100, 100);
        const floorMaterial = new graphics.MeshBasicMaterial({ color: 0x808080});
        const floor = new graphics.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        this.add(floor);
    }
}

class Wall extends graphics.Group {
    constructor(width, height, depth) {
        super();
        const wallGeometry = new graphics.BoxGeometry(width, height, depth);
        const wallMaterial = new graphics.MeshBasicMaterial({ color: 0x00ff00 });
        const wall = new graphics.Mesh(wallGeometry, wallMaterial);

        wall.position.set(width / 2, height / 2, 0);
        this.add(wall);
    }
}

// add components to the scene

scene.add(new Floor(100, 100));
scene.add(new Wall(10, 5, 1));

// keystroke listeners for opening the menu and catalogue

const menu = document.getElementById('main-menu');
const catalogue = document.getElementById('catalogue');

window.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
        menu.classList.toggle('hidden');
    } else if (event.key === 'i' || event.key === 'I') {
        catalogue.classList.toggle('hidden');
    }
}); 

// menu inputs affect room size

window.addEventListener('click', () => {
    const width = parseFloat(document.getElementById('room-width').value);
    const depth = parseFloat(document.getElementById('room-depth').value);
    const height = parseFloat(document.getElementById('room-height').value);

    scene.children.forEach(child => {
        if (child instanceof Floor) {
            child.scale.set(width / 100, 1, depth / 100);
        }
        if (child instanceof Wall) {
            child.scale.set(width / 10, height / 5, 1);
        }
    });

    console.log(`Room size updated to: ${width} x ${height} x ${depth}`);
})

// begin the animation

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();