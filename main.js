/*
this is the main file for the pallet optimizer
it will handle all the logic and event listeners
and will call helper functions to do the heavy lifting

add event listeners (to run main function)

run main function (helper functions)
  get inputs
  calculate theoretical max boxes
  calculate needed orientation checks
  populate matrix
  find most efficient configuration
  draw the pallet
*/

//
// assign variables to the input/button/canvas elements on load
//

let palletLengthElement,
  palletWidthElement,
  boxLengthElement,
  boxWidthElement,
  submitButton,
  canvas;

document.addEventListener("DOMContentLoaded", () => {
  palletLengthElement = document.getElementById("pallet-length");
  palletWidthElement = document.getElementById("pallet-width");
  boxLengthElement = document.getElementById("box-length");
  boxWidthElement = document.getElementById("box-width");
  buttonElement = document.getElementById("submit");
  canvasElement = document.getElementById("canvas");
  // console.log("loaded elements");
});

//
// add event listeners (to run main function)
//

document.addEventListener("DOMContentLoaded", () => {
  palletLengthElement.addEventListener("input", main);
  palletWidthElement.addEventListener("input", main);
  boxLengthElement.addEventListener("input", main);
  boxWidthElement.addEventListener("input", main);
  buttonElement.addEventListener("click", main);
  // console.log("added event listeners");
});

//
// Main function
//

function main() {
  // console.log("running main function");
  getInputs();
  calculateMaxBoxes();
  populateMatrix();
  findMostEfficientConfig();
  drawConfig();
  console.log("main function complete");
}

//
// Helper functions
//

// get inputs

let palletLength, palletWidth, boxLength, boxWidth;

function getInputs() {
  palletLength = palletLengthElement.value;
  palletWidth = palletWidthElement.value;
  boxLength = boxLengthElement.value;
  boxWidth = boxWidthElement.value;

  // console.log(
  //   "inputs Received:",
  //   palletLength,
  //   palletWidth,
  //   boxLength,
  //   boxWidth
  // );
}

// calculate theoretical max boxes

let maxBoxes;

function calculateMaxBoxes() {
  // console.log("calculating max boxes:");
  palletArea = palletLength * palletWidth;
  boxArea = boxLength * boxWidth;
  maxBoxes = palletArea / boxArea;
  console.log("max boxes calculated:", maxBoxes);
}

//
// populate matrix
//

/*
the matrix holds all the pallet and box data
each calculation will be stored in the matrix
[
  [0]palletX,
  [1]palletY,
  [2]boxMax,
  [3]boxMin,
  [4]palletX/boxMin,
  [5]palletY/boxMax,
  [6](palletX-[4]*boxMin)/boxMax,
  [7]palletY/boxMin,
  [8]TotalBoxes
]
*/

let matrix = [];

const populateMatrix = () => {
  console.log("populating matrix");
  // temp template for first pallet orientation
  matrix = [];
  let temp = [];
  temp[0] = palletLength;
  temp[1] = palletWidth;
  temp[2] = Math.max(boxLength, boxWidth);
  temp[3] = Math.min(boxLength, boxWidth);
  temp[4] = null; // Math.floor(temp[0] / temp[3]);
  temp[5] = Math.floor(temp[1] / temp[2]);
  temp[6] = null; // Math.floor((temp[0] - temp[4] * temp[3]) / temp[2]);
  temp[7] = Math.floor(temp[1] / temp[3]);
  temp[8] = null; // temp[4] * temp[5] + temp[6] * temp[7];

  let i = Math.floor(temp[0] / temp[3]);

  for (i; i > 0; i--) {
    let matrixItem = [...temp];
    matrixItem[4] = i;
    matrixItem[6] = Math.floor((temp[0] - i * temp[3]) / temp[2]);
    matrixItem[8] = i * temp[5] + matrixItem[6] * temp[7];
    matrix.push(matrixItem);
  }

  // adjust temp for rotated pallet orientation
  temp[0] = palletWidth;
  temp[1] = palletLength;
  temp[2] = Math.max(boxLength, boxWidth);
  temp[3] = Math.min(boxLength, boxWidth);
  temp[4] = null; // Math.floor(temp[0] / temp[3]);
  temp[5] = Math.floor(temp[1] / temp[2]);
  temp[6] = null; // Math.floor((temp[0] - temp[4] * temp[3]) / temp[2]);
  temp[7] = Math.floor(temp[1] / temp[3]);
  temp[8] = null; // temp[4] * temp[5] + temp[6] * temp[7];

  i = Math.floor(temp[0] / temp[3]);

  for (i; i > 0; i--) {
    let matrixItem = [...temp];
    matrixItem[4] = i;
    matrixItem[6] = Math.floor((temp[0] - i * temp[3]) / temp[2]);
    matrixItem[8] = i * temp[5] + matrixItem[6] * temp[7];
    matrix.push(matrixItem);
  }

  console.log("matrix populated:", matrix);
};

// 
// find most efficient configuration
//

let mostEfficientConfig;

const findMostEfficientConfig = () => {
  console.log("finding most efficient configuration");
  let max = 0;
  mostEfficientConfig = [];
  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i][8] > max) {
      mostEfficientConfig = matrix[i];
      max = matrix[i][8];
    }
  }
  console.log("most efficient configuration found:", mostEfficientConfig);
};

//
// draw the pallet
//

/*
Draw config will take the:
  Canvas height
  Canvas width
  mostEfficientConfig

and return pallet cx, cy, width, height
and array of box cx, cy, width, height
*/


const drawConfig = () => {
  console.log("drawing configuration");
  let canvasElement = document.getElementById("canvas");
  let ctx = canvasElement.getContext("2d");
  let canvasWidth = canvasElement.width;
  let canvasHeight = canvasElement.height;

  // draw canvas linear gradent of white to gray at 30 degrees
  let gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, "white");
  gradient.addColorStop(1, "gray");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // create array of box cx, cy, width, height using real values before scaling
  let boxes = [
    {
      // pallet
      cx: mostEfficientConfig[0] / 2,
      cy: mostEfficientConfig[1] / 2,
      width: mostEfficientConfig[0],
      height: mostEfficientConfig[1],
    }
  ];
  for (let i = 0; i < mostEfficientConfig[4]; i++) {
    for (let j = 0; j < mostEfficientConfig[5]; j++) {
      let box = {
        cx: i * boxLength + boxLength / 2,
        cy: j * boxWidth + boxWidth / 2,
        width: boxLength,
        height: boxWidth,
      };
      boxes.push(box);
    }
  }
  
  let offsetX = mostEfficientConfig[4] * boxLength;  // The total width of the first set of boxes
  
  for (let i = 0; i < mostEfficientConfig[6]; i++) {
    for (let j = 0; j < mostEfficientConfig[7]; j++) {
      let box = {
        cx: i * boxWidth + boxWidth / 2 + offsetX,  // Offset the x-coordinate for the rotated boxes
        cy: j * boxLength + boxLength / 2,
        width: boxWidth,
        height: boxLength,
      };
      boxes.push(box);
    }
  }

  // scale boxes to fit canvas
  let scale = Math.min(
    canvasWidth / mostEfficientConfig[0],
    canvasHeight / mostEfficientConfig[1]
  );
  boxes.forEach((box) => {
    box.cx *= scale;
    box.cy *= scale;
    box.width *= scale;
    box.height *= scale;
  });

  // draw boxes

  boxes.forEach((box, i) => {
    ctx.fillStyle = i ? "tan" : "brown";
    ctx.fillRect(
      box.cx - box.width / 2,
      box.cy - box.height / 2,
      box.width,
      box.height
    );
    ctx.strokeStyle = "black";
    ctx.strokeRect(
      box.cx - box.width / 2,
      box.cy - box.height / 2,
      box.width,
      box.height
    );
  });

  console.log("boxes array created:", boxes);
};