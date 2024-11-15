document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submit").addEventListener("click", main);
});

function main(e) {
  e.preventDefault();
  let inputs = getInputs();
  let matrix = populateMatrix(inputs);
  let res = findres(matrix);
  const { ctx, canWd, canHt } = initializeCanvas();

  const boxes = generateBoxes(res);
  console.log("Inputs:", inputs);
  console.log("Before scaling (in inches):", boxes);

  const scaledBoxes = scaleAndCenterBoxes(boxes, res, canWd, canHt);
  drawBoxes(ctx, scaledBoxes);
}

function getInputs() {
  let pLen = document.getElementById("pallet-length").value;
  let pWid = document.getElementById("pallet-width").value;
  let bLen = document.getElementById("box-length").value;
  let bWid = document.getElementById("box-width").value;
  if (pLen <= 0) pLen = 1;
  if (pWid <= 0) pWid = 1;
  if (bLen <= 0) bLen = 1;
  if (bLen <= 0) bLen = 1;
  return { pLen, pWid, bLen, bWid };
}

const populateMatrix = ({ pLen, pWid, bLen, bWid }) => {
  let matrix = [];
  let temp = [];

  temp[0] = pLen;
  temp[1] = pWid;
  temp[2] = Math.max(bLen, bWid);
  temp[3] = Math.min(bLen, bWid);
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
  temp[0] = pWid;
  temp[1] = pLen;
  temp[2] = Math.max(bLen, bWid);
  temp[3] = Math.min(bLen, bWid);
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
  return matrix;
};

const findres = (matrix) => {
  let max = 0;
  let res = [];
  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i][8] > max) {
      res = matrix[i];
      max = matrix[i][8];
    }
  }
  return res;
};

const initializeCanvas = () => {
  const canEl = document.getElementById("canvas");
  const ctx = canEl.getContext("2d");
  const canWd = canEl.width;
  const canHt = canEl.height;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canWd, canHt);
  return { ctx, canWd, canHt };
};

const generateBoxes = (res) => {
  let [pX, pY, bMax, bMin, minCols, maxRows, maxCols, minRows] = res;

  const boxes = [];

  // Draw the pallet outline
  boxes.push({
    cx: pX / 2,
    cy: pY / 2,
    width: pX,
    height: pY,
  });

  // Calculate offsets for centering each set of boxes
  const minColYOffset = (pY - maxRows * bMax) / 2;
  const maxColXOffset = minCols * bMin;
  const maxColYOffset = (pY - minRows * bMin) / 2;

  // Generate boxes for the first configuration (minCols x maxRows)
  for (let i = 0; i < minCols; i++) {
    for (let j = 0; j < maxRows; j++) {
      boxes.push({
        cx: i * bMin + bMin / 2,
        cy: j * bMax + bMax / 2 + minColYOffset,
        width: bMin,
        height: bMax,
      });
    }
  }

  // Generate boxes for the second configuration (maxCols x minRows)
  for (let i = 0; i < maxCols; i++) {
    for (let j = 0; j < minRows; j++) {
      boxes.push({
        cx: i * bMax + bMax / 2 + maxColXOffset,
        cy: j * bMin + bMin / 2 + maxColYOffset,
        width: bMax,
        height: bMin,
      });
    }
  }

  console.log("Adjusted Boxes:", JSON.stringify(boxes, null, 2));
  return boxes;
};

const scaleAndCenterBoxes = (boxes, res, canWd, canHt) => {
  const [pX, pY] = res;
  const scale = Math.min((canWd * 0.9) / pX, (canHt * 0.9) / pY);
  const offsetX = (canWd - pX * scale) / 2;
  const offsetY = (canHt - pY * scale) / 2;

  // Create a deep copy of the boxes array to avoid modifying the original
  const scaledBoxes = boxes.map((box) => ({ ...box }));

  scaledBoxes.forEach((box) => {
    box.cx = box.cx * scale + offsetX;
    box.cy = box.cy * scale + offsetY;
    box.width *= scale;
    box.height *= scale;
  });

  return scaledBoxes; // Return the new scaled boxes array
};

const drawBoxes = (ctx, boxes) => {
  const img = new Image();
  img.src = "pallet.png";
  img.onload = function () {
    boxes.forEach((box, i) => {
      if (i === 0) {
        ctx.drawImage(
          img,
          box.cx - box.width / 2,
          box.cy - box.height / 2,
          box.width,
          box.height
        );
      } else {
        ctx.fillStyle = "tan";
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
      }
    });
  };
};

function adjustForControlPanel() {
  // get canvas element
  const canvas = document.getElementById("canvas");

  // Use visualViewport.height on mobile for better accuracy
  const totalHeight = document.documentElement.clientHeight;
  const visibleHeight = window.innerHeight;
  const controlPanelHeight = totalHeight - visibleHeight;

  // For mobile browsers, use visualViewport.height to better detect visible area
  const mobileVisibleHeight = window.visualViewport ? window.visualViewport.height : visibleHeight;
  const mobileControlPanelHeight = totalHeight - mobileVisibleHeight;

  console.log("totalHeight:", totalHeight);
  console.log("visibleHeight:", visibleHeight);
  console.log("controlPanelHeight:", controlPanelHeight);
  console.log("mobileVisibleHeight:", mobileVisibleHeight);
  console.log("mobileControlPanelHeight:", mobileControlPanelHeight);

  // Apply margin based on the correct height detection
  const finalControlPanelHeight = mobileControlPanelHeight > 0 ? mobileControlPanelHeight : controlPanelHeight;

  if (finalControlPanelHeight > 0) {
    canvas.style.marginBottom = finalControlPanelHeight + "px";
    canvas.style.border = "1px solid black";
  } else {
    canvas.style.marginBottom = "0px";
    canvas.style.border = '1px solid red';
  }
}

window.addEventListener("load", adjustForControlPanel);
window.addEventListener("resize", adjustForControlPanel);

