/**
 * 「あと何セル破壊するか」を純粋関数として計算する。
 * 累積割合の差分（床関数）で配分するため、最後の一打で必ず残り全部が破壊される
 * （端数を切り捨てても取りこぼしが出ない）。
 */
export function computeCellsToDestroy(totalCells, totalKeystrokes, keystrokesDoneBefore, keystrokesDoneAfter) {
  if (totalCells <= 0 || totalKeystrokes <= 0) return 0;

  const before = Math.floor((totalCells * keystrokesDoneBefore) / totalKeystrokes);
  const after =
    keystrokesDoneAfter >= totalKeystrokes ? totalCells : Math.floor((totalCells * keystrokesDoneAfter) / totalKeystrokes);

  return Math.max(0, after - before);
}
