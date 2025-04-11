import PerspectiveCamera from "./perscamera";

export default class OrbitalController {
    camera: PerspectiveCamera;
    canvas: HTMLCanvasElement;
    isDragging: boolean;
    previousMousePosition: { x: number; y: number; };

    constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.canvas = canvas;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        this.initEventListeners();
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));
    }

    onMouseDown(event: MouseEvent) {
        this.isDragging = true;
        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onMouseMove(event: MouseEvent) {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        this.camera.rotation.y -= deltaX * 0.005;
        this.camera.rotation.x += deltaY * 0.005;
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));

        this.camera.updatePosition();
        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onMouseWheel(event: WheelEvent) {
        this.camera.distance += event.deltaY * 0.01;
        this.camera.distance = Math.max(1, this.camera.distance);
        this.camera.updatePosition();
    }
}