/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildStaticTable(block, header) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');

    [...row.children].forEach((cell) => {
      const td = document.createElement(i === 0 && header ? 'th' : 'td');
      if (i === 0) td.setAttribute('scope', 'column');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });
    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(table);
}

function getSheetLink(block) {
  const link = block.querySelector('a[href$=".json"]');
  return link ? link.href : null;
}

function buildDynamicTable(block, json) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Determine display columns (exclude helper columns like "Customer URL Text")
  const allNames = json[':names'] || Object.keys(json.data[0] || {});
  const helperColumns = allNames.filter((n) => n.endsWith(' Text'));
  const displayNames = allNames.filter((n) => !n.endsWith(' Text'));

  // Build header row
  const headerRow = document.createElement('tr');
  displayNames.forEach((name) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'column');
    // Convert "Customer URL" header to "Customer URLs" to match original
    th.textContent = name === 'Customer URL' ? 'Customer URLs' : name;
    headerRow.append(th);
  });
  thead.append(headerRow);

  // Build data rows
  json.data.forEach((row) => {
    const tr = document.createElement('tr');
    displayNames.forEach((name) => {
      const td = document.createElement('td');
      const value = row[name] || '';

      // Check if this column has a companion "Text" column for link display
      const textCol = `${name} Text`;
      if (helperColumns.includes(textCol) && row[textCol] && value.startsWith('http')) {
        const a = document.createElement('a');
        a.href = value;
        a.textContent = row[textCol];
        td.append(a);
      } else {
        td.textContent = value;
      }
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  block.replaceChildren(table);
}

export default async function decorate(block) {
  const header = !block.classList.contains('no-header');
  const sheetUrl = getSheetLink(block);

  if (sheetUrl) {
    try {
      const resp = await fetch(sheetUrl);
      if (!resp.ok) throw new Error(`Failed to fetch sheet: ${resp.status}`);
      const json = await resp.json();
      buildDynamicTable(block, json);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error loading table data:', e);
      buildStaticTable(block, header);
    }
  } else {
    buildStaticTable(block, header);
  }
}
