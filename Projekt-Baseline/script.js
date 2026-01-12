const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");

let polygons = [];
let currentPolygon = [];
let mousePos = null;
let undoStack = [];
let redoStack = [];
let color = 0;

const colors = [
    "red",
    "green",
    "blue",
    "yellow",
    "purple",
    "orange"
];

//Farbe bekommen
function getNextColor() {
    return colors[color++ % colors.length];
}

  //Undo
function saveState() {
    undoStack.push(JSON.stringify({
        polygons,
        currentPolygon,
        color
    }));
    redoStack.length = 0;
}
//Redo
function restoreState(state) {
    const tmp = JSON.parse(state);
    polygons = tmp.polygons;
    currentPolygon = tmp.currentPolygon;
    color = tmp.color;
    draw();
}


//Zeichnen
function draw() {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    polygons.forEach(p =>
        drawPolygon(p.points, false, p.color)
    );

    if (currentPolygon.length > 0) {
        drawPolygon(currentPolygon, true, "black");
    }
}

function drawPolygon(points, preview, color) {
    if (!points.length) return;

    canvasContext.beginPath();
    canvasContext.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        canvasContext.lineTo(points[i].x, points[i].y);
    }

    if (!preview && points.length >= 2) canvasContext.closePath();

    canvasContext.strokeStyle = color;
    canvasContext.lineWidth = 2;
    canvasContext.stroke();

    points.forEach(p => {
        canvasContext.beginPath();
        canvasContext.arc(p.x, p.y, 4, 0, Math.PI * 2);
        canvasContext.fillStyle = color;
        canvasContext.fill();
    });

    if (preview && mousePos) {
        const last = points[points.length - 1];
        canvasContext.beginPath();
        canvasContext.moveTo(last.x, last.y);
        canvasContext.lineTo(mousePos.x, mousePos.y);
        canvasContext.setLineDash([6, 6]);
        canvasContext.stroke();
        canvasContext.setLineDash([]);
    }
}


// Klick-Handling
let clickTimer = null;
const CLICK_DELAY = 200;

// Einfachklick, Punkt setzen
canvas.addEventListener("click", e => {
    if (clickTimer) return;

    clickTimer = setTimeout(() => {
        saveState();

        const rect = canvas.getBoundingClientRect();
        currentPolygon.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });

        draw();
        clickTimer = null;
    }, CLICK_DELAY);
});

//Doppelklick ,Polygon beenden
canvas.addEventListener("dblclick", e => {
    if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
    }

    if (currentPolygon.length >= 2) {
        saveState();

        polygons.push({
            points: currentPolygon,
            color: getNextColor()
        });

        currentPolygon = [];
        mousePos = null;
        draw();
    }
});

// Mausbewegung 
canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    draw();
});

//Undo / Redo Buttons
document.getElementById("undoBtn").addEventListener("click", () => {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify({ polygons, currentPolygon, color }));
    restoreState(undoStack.pop());
});

document.getElementById("redoBtn").addEventListener("click", () => {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify({ polygons, currentPolygon, color }));
    restoreState(redoStack.pop());
});
