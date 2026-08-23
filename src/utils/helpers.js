export const generateBoxDescription = ({ boxName, length, width, height, unit, category, ply, paperGsm, paperBf, openType }) => {
  const parts = [];
  if (boxName && boxName.trim()) parts.push(boxName.trim());
  if (length && width && height) parts.push(`${length} × ${width} × ${height} ${unit || 'mm'}`);
  if (category) parts.push(category);
  if (ply) parts.push(`${ply}-Ply`);
  if (paperGsm || paperBf) {
    const specStr = [paperGsm ? paperGsm.trim() : '', paperBf ? paperBf.trim() : ''].filter(Boolean).join(' ');
    if (specStr) parts.push(specStr);
  }
  if (openType) parts.push(openType);
  return parts.join(' — ');
};

export const formatINR = (amount) => {
  const val = parseFloat(amount) || 0;
  return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};
