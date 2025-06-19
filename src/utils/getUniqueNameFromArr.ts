export default function getUniqueNameFromArr(arr: string[], str: string) {
  let newStr = str;
  let counter = 1;

  // 使用一个循环来查找一个新的字符串
  while (arr.includes(newStr)) {
    counter++;
    newStr = `${str}_${counter}`;
  }

  // 将新的字符串推入数组
  // arr.push(newStr);

  return newStr;
}