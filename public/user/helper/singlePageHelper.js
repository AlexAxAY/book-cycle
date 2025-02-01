$(document).ready(function () {
  $(".thumbnail").click(function () {
    const imgUrl = $(this).attr("src");
    $("#mainImage").attr("src", imgUrl);
    $(".thumbnail").removeClass("active");
    $(this).addClass("active");
  });
});

$(document).ready(function () {
  const mainImage = $("#mainImage");
  const zoomedImage = $("#zoomedImage");

  mainImage.hover(
    function () {
      const imgUrl = $(this).attr("src");
      zoomedImage.css("background-image", `url(${imgUrl})`);
      zoomedImage.show();
    },
    function () {
      zoomedImage.hide();
    }
  );

  mainImage.mousemove(function (e) {
    const zoomWidth = zoomedImage.width();
    const zoomHeight = zoomedImage.height();
    const offset = mainImage.offset();
    const relX = e.pageX - offset.left;
    const relY = e.pageY - offset.top;
    const backgroundPosX = (relX / mainImage.width()) * 100;
    const backgroundPosY = (relY / mainImage.height()) * 100;

    zoomedImage.css(
      "background-position",
      `${backgroundPosX}% ${backgroundPosY}%`
    );
  });
});

document.querySelectorAll(".view-product-button").forEach((button) => {
  button.addEventListener("click", function () {
    const Id = this.getAttribute("data-id");
    window.location.href = `/user/shop/product/${Id}`;
  });
});
