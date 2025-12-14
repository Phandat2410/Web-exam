function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Thi Trắc Nghiệm Online')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function getSubjects() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const menuSheet = ss.getSheetByName('Menu');
  if (!menuSheet) return [];
  const values = menuSheet.getRange('C3:C' + menuSheet.getLastRow()).getValues().flat().filter(String);
  return values.map(name => name.trim());
}


function getTotalQuestions(subject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(subject);
  if (!sheet) return 0;
  const data = sheet.getDataRange().getValues().slice(1);
  return data.filter(row => row[1]).length;
}


function getQuestions(subject, numQuestions, type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(subject);
  if (!sheet) throw new Error('Không tìm thấy sheet môn học!');
 
  let data = sheet.getDataRange().getValues().slice(1);
  data = data.filter(row => row[1]);
  if (data.length === 0) throw new Error('Không có câu hỏi nào!');
 
  // Xáo trộn câu hỏi
  data.sort(() => Math.random() - 0.5);
  if (numQuestions !== 'Full') {
    numQuestions = parseInt(numQuestions);
    if (numQuestions > data.length) numQuestions = data.length;
    data = data.slice(0, numQuestions);
  }
 
  // Xáo trộn đáp án cho mỗi câu (nếu Trắc nghiệm)
  const questions = data.map(row => {
    let q = {
      question: row[1],
      a: row[2],
      b: row[3],
      c: row[4],
      d: row[5],
      correct: row[6].toUpperCase()
    };
   
    if (type === 'Trac nghiem') {
      const original_options = [q.a, q.b, q.c, q.d];
      const letters = ['A', 'B', 'C', 'D'];
      const original_correct_index = letters.indexOf(q.correct);
      if (original_correct_index === -1) throw new Error('Đáp án đúng không hợp lệ!');
     
      const indices = [0, 1, 2, 3];
      indices.sort(() => Math.random() - 0.5);
     
      const new_options = indices.map(i => original_options[i]);
      q.a = new_options[0];
      q.b = new_options[1];
      q.c = new_options[2];
      q.d = new_options[3];
     
      const new_correct_index = indices.indexOf(original_correct_index);
      q.correct = letters[new_correct_index];
    }
   
    return q;
  });
 
  return questions;
}


function getStats(subject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let scoresSheet = ss.getSheetByName('Scores');
  if (!scoresSheet) {
    scoresSheet = ss.insertSheet('Scores');
    scoresSheet.appendRow(['Date', 'Name', 'Subject', 'Score', 'TimeUsed']);
  }
 
  const data = scoresSheet.getDataRange().getValues().slice(1);
  const totalAttempts = data.length;
  const subjectAttempts = data.filter(row => row[2] === subject).length;
 
  return { totalAttempts, subjectAttempts };
}


function submitScore(data) {
  const { name, subject, score, timeUsed } = data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scoresSheet = ss.getSheetByName('Scores');
  scoresSheet.appendRow([new Date(), name, subject, score, timeUsed]);
 
  const allScores = scoresSheet.getDataRange().getValues().slice(1);
  const top = allScores
    .sort((a, b) => b[3] - a[3] || a[4] - b[4]) // Sort by score desc, then time asc
    .slice(0, 3)
    .map(row => ({ name: row[1], score: row[3], time: row[4] }));
 
  return top;
}



