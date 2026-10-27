// iPhone 16 Pro — landing nhỏ
(() => {
  const phone = document.querySelector(".phone");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Màn hình điện thoại đổi theo đoạn đang đọc (không cần GSAP).
  const sections = document.querySelectorAll("[data-screen]:not(.phone)");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) phone.dataset.screen = e.target.dataset.screen;
      });
    },
    // Dải mỏng giữa vùng đọc; trên mobile điện thoại chiếm nửa trên nên dời dải xuống.
    { rootMargin: window.innerWidth < 800 ? "-62% 0px -30% 0px" : "-45% 0px -45% 0px" }
  );
  sections.forEach((s) => io.observe(s));

  // 2. Đổi màu vỏ.
  const current = document.querySelector(".colors-current");
  const finishes = { desert: "#BFA48F", natural: "#B9B6AE", white: "#E7E5E0", black: "#3C3C3E" };
  document.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".swatch").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      document.documentElement.style.setProperty("--frame", finishes[btn.dataset.finish]);
      current.textContent = btn.dataset.name;
    });
  });

  if (!window.gsap) return; // CDN lỗi: trang vẫn dùng được

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // 3. Cuộn mượt bằng Lenis, đồng bộ với ScrollTrigger.
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Link neo cuộn mượt, trừ chiều cao thanh điều hướng.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const dest = a.getAttribute("href") === "#top" ? 0 : target;
      if (lenis) lenis.scrollTo(dest, { duration: 1.2 });
      else target.scrollIntoView();
      history.replaceState(null, "", a.getAttribute("href"));
    });
  });

  const mm = gsap.matchMedia();

  mm.add(
    { isDesktop: "(min-width: 800px)", reduce: "(prefers-reduced-motion: reduce)" },
    (ctx) => {
      const { isDesktop, reduce } = ctx.conditions;
      if (reduce) return; // giữ nguyên bố cục tĩnh

      // 4. Một khoảnh khắc mở màn: tiêu đề trồi lên từng dòng, điện thoại nghiêng vào.
      document.fonts.ready.then(() => {
        const split = SplitText.create(".hero-title .line", { type: "lines", mask: "lines" });
        const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.1 } });
        tl.from(split.lines, { yPercent: 105, stagger: 0.12 })
          .from(".hero-sub, .hero-actions", { autoAlpha: 0, y: 16, stagger: 0.08, duration: 0.8 }, "-=0.7")
          .from(phone, { autoAlpha: 0, y: 120, rotation: isDesktop ? 14 : 0, duration: 1.4 }, 0.1);
      });

      // 5. Cuộn qua hero: điện thoại xoay về thẳng đứng, theo đúng tiến độ cuộn.
      if (isDesktop) {
        gsap.fromTo(
          phone,
          { rotation: -8, scale: 1 },
          {
            rotation: 0,
            scale: 1.08,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom center", scrub: true },
          }
        );
        gsap.set(phone, { rotation: -8 });
      }
    }
  );
})();
