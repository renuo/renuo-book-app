// Needs an HTML table with vertical TH tags. Its only output are "selected" classes on the TD tags.
function initializeSelector(table) {
  let isMouseDown = false;
  let startRowIndex = null;
  let startColumnIndex = null;

  function retrieveSelection(cell) {
    const row = cell.parent();
    const colIndex = cell.index() - 1; // exclude th tag
    const rowIndex = row.index();
    const selectedCells = [];

    let rowStart, rowEnd, colStart, colEnd;

    if (rowIndex < startRowIndex) {
      rowStart = rowIndex;
      rowEnd = startRowIndex;
    } else {
      rowStart = startRowIndex;
      rowEnd = rowIndex;
    }

    if (colIndex < startColumnIndex) {
      colStart = colIndex;
      colEnd = startColumnIndex;
    } else {
      colStart = startColumnIndex;
      colEnd = colIndex;
    }

    for (let i = rowStart; i <= rowEnd; i++) {
      const rowCells = table.find("tr").eq(i).find("td");
      for (let j = colStart; j <= colEnd; j++) {
        selectedCells.push(rowCells.eq(j));
      }
    }

    return selectedCells;
  }

  table.find("td").mousedown(function(e) {
    isMouseDown = true;
    const cell = $(this);

    table.find(".selected").removeClass("selected"); // deselect everything

    if (e.shiftKey) {
      retrieveSelection(cell).forEach((e) => e.addClass("selected"));
    } else {
      cell.addClass("selected");
      startColumnIndex = cell.index() - 1;
      startRowIndex = cell.parent().index();
    }

    return false; // prevent text selection
  }).mouseover(function () {
      if (!isMouseDown) return;
      table.find(".selected").removeClass("selected");
      retrieveSelection($(this)).forEach((e) => e.addClass("selected"));
    })
    .bind("selectstart", function () {
      return false;
    });

  $(document).mouseup(function () {
    isMouseDown = false;
  });
}
