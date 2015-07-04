function sendAjax(url, data, success, error) {
  $.ajax({
    url: 'http://localhost:3000'+url,
    type:'POST',
    data: data,
    success: success,
    error: error,
  });
}