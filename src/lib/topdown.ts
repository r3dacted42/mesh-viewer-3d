import OrthographicCamera from "./orthocamera";

export default class TopDownController {
    camera: OrthographicCamera;
    canvas: HTMLCanvasElement;
    isDragging: boolean;
    previousMousePosition: { x: number; y: number; };

    constructor(camera: OrthographicCamera, canvas: HTMLCanvasElement) {
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

        const dx = event.clientX - this.previousMousePosition.x;
        const dy = event.clientY - this.previousMousePosition.y;

        const scale = 0.01 * 10 / this.camera.zoom;
        this.camera.pan(-dx * scale, dy * scale);

        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onMouseWheel(event: WheelEvent) {
        this.camera.setZoom(this.camera.zoom - event.deltaY * 0.001);
    }
}
