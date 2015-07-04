function sendAjax(url, data, success, error) {
  $.ajax({
    url: 'http://www.icedeer.net:9000'+url,
    type:'POST',
    data: data,
    success: success,
    error: error,
  });
}