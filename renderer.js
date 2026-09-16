import * as graphics from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create a scene, camera, and renderer

const scene = new graphics.Scene();
const camera = new graphics.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new graphics.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const viewer = new OrbitControls(camera, renderer.domElement);
viewer.enableDamping = true;
viewer.dampingFactor = .05;
viewer.maxPolarAngle = Math.PI / 2 - .05

// create new components for the scene
class Floor extends graphics.Group {
    constructor(width, depth) {
        super();
        const floorGeometry = new graphics.PlaneGeometry(100, 100);
        const floorMaterial = new graphics.MeshBasicMaterial({ color: 0x808080, side: graphics.DoubleSide});
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

        wall.position.set(widht / 2, height / 2, 0);
        this.add(wall);
    }
}

class Furniture extends graphics.Group {
    constructor(width, height, depth) {
        super();
        const componentGeometry = new graphics.BoxGeometry(width, height, depth);
        const componentMaterial = new graphics.MeshBasicMaterial({ color: 0x00ff00 });
        const component = new graphics.Mesh(componentGeometry, componentMaterial);

        component.position.set(width / 2, height / 2, 0);
        this.add(component);
    }
}

// adds raycaster

const ray = new graphics.Raycaster();
const mouse = new graphics.Vector2();
const wallSegments = [];
let points = [];
let temp = null;

function getIntersection(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    ray.setFromCamera(mouse, camera);

    const floor = scene.children.find(child => child instanceof Floor);
    if (!floor) return null;

    const intersects = ray.intersectObjects(floor.children);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        point.x = Math.round(point.x);
        point.z = Math.round(point.z);
        point.y = 0;
        return point
    }

    return null;
}

function onMove(event) {
    const point = getIntersection(event);
    if (point && points.length > 0) {
        if (temp) scene.remove(temp);
        const geometry = new graphics.BufferGeometry().setFromPoints([points[points.length - 1], point]);
        const material = new graphics.LineBasicMaterial({ color: 0x808080});
        temp = new graphics.Line(geometry, material);
        scene.add(temp)
    }
}

function onDown(event) {
    if (event.button !== 0) return;
    const point = getIntersection(event);
    if (point) {
        points.push(point);
        if (points.length > 1) {
            const start = points[points.length - 2];
            const end = points[points.length - 1];
            const length = start.distanceTo(end);

            const block = new Furniture(length, 5, 1);
            block.position.copy(start);
            block.rotation.y = Math.atan2(end.z - start.z, end.x - start.x);
            scene.add(block);
            wallSegments.push(block);
        }
    }
}

// add 3D components

scene.add(new Floor(100, 100));

// button listeners

let placementButton = document.getElementById('add-furniture-button');
let place = false;
placementButton.addEventListener('click', (event) => {
    place = !place;
});

let refocusButton = document.getElementById('refocus-button');
refocusButton.addEventListener('click', (event) => {
    viewer.target.set(0, 0, 0,);
    camera.position.set(0, 5, 10);
});

// mouse listeners for customizing map

window.addEventListener('mousemove', (event) => {
    if (place) {
        onMove(event)
    }}
);
window.addEventListener('mousedown', (event) => {
        if (place) {
            onDown(event)
        }
    }
);

// keystroke listeners for UI components

const menu = document.getElementById('main-menu');
const catalogue = document.getElementById('catalogue');

window.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
        menu.classList.toggle('hidden');
    } else if (event.key === 'i' || event.key === 'I') {
        catalogue.classList.toggle('hidden');
    }
}); 

// keystroke listeners for camera

const forward = new graphics.Vector3();
const sideways = new graphics.Vector3();
const movement = new graphics.Vector3();

window.addEventListener('keydown', (event) => {
    const speed = .5;

    camera.getWorldDirection(forward);

    forward.y = 0;
    forward.normalize();

    sideways.crossVectors(forward, camera.up).normalize();

    movement.set(0, 0, 0);

    switch (event.key) {
        case 'w': case 'W':
            movement.addScaledVector(forward, speed);
            break;
        case 's': case 'S':
            movement.addScaledVector(forward, -speed);
            break;
        case 'a': case 'A':
            movement.addScaledVector(sideways, -speed);
            break;
        case 'd': case 'D':
            movement.addScaledVector(sideways, speed);
            break;
    }

    camera.position.add(movement); viewer.target.add(movement);
    viewer.update();
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
});

// begin the animation

function animate() {
    requestAnimationFrame(animate);
    viewer.update();
    renderer.render(scene, camera);
}
animate();