// export const generatePDF = async ({
//   elementRef,
//   formData,
//   formDataKey = "document",
//   download = false,
//   fileName = "Rafeeqi_Travel_Document.pdf",
//   extraHeight = 0,
//   setIsGenerating,
// }) => {
//   if (!elementRef.current) return formData || null;

//   try {
//     setIsGenerating(true);

//     // Dynamically import the libraries
//     const { jsPDF } = await import("jspdf");
//     const html2canvas = (await import("html2canvas-pro")).default;

//     // A3 dimensions in mm (297mm x 420mm)
//     const a3Width = 297;
//     const a3Height = 420;

//     // Get the content element
//     const content = elementRef.current;

//     // Calculate content dimensions
//     const contentWidth = content.offsetWidth;
//     const contentHeight = content.scrollHeight + extraHeight;

//     // For larger content, fit to page with some margin
//     let scale;

//     // For larger content, fit to page with some margin
//     scale = Math.min(a3Width / contentWidth, a3Height / contentHeight) * 0.9;

//     const canvas = await html2canvas(content, {
//       scale: 2, // Higher scale for better quality
//       useCORS: true,
//       logging: false,
//       backgroundColor: "#ffffff",
//       width: contentWidth,
//       height: contentHeight,
//       scrollX: 0,
//       scrollY: 0,
//       x: 0,
//       y: 0,
//     });

//     const imgData = canvas.toDataURL("image/png");

//     // Create PDF with A3 dimensions
//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a3",
//       putOnlyUsedFonts: true,
//       compress: true,
//     });

//     // Calculate positioning to center content
//     const pdfWidth = pdf.internal.pageSize.getWidth();

//     const scaledImgWidth = contentWidth * scale;
//     const scaledImgHeight = contentHeight * scale;

//     // For small content, position it higher on the page with fixed margins
//     const x = (pdfWidth - scaledImgWidth) / 2;
//     // Add image to PDF
//     pdf.addImage(imgData, "PNG", x, 15, scaledImgWidth, scaledImgHeight);

//     // Add metadata
//     pdf.setProperties({
//       title: "Rafeeqi Travel Document",
//       subject: "Travel Document",
//       author: "Rafeeqi Ltd. Co.",
//       keywords: "travel, document, rafeeqi",
//       creator: "Rafeeqi Document System",
//     });

//     // Handle download parameter
//     if (download) {
//       // Save the PDF for download
//       pdf.save(fileName);
//       return formData; // Return formData in case it's needed
//     }

//     // Handle formData parameter
//     if (formData) {
//       // Convert PDF to binary blob
//       const pdfBlob = pdf.output("blob");

//       // Create a File object from the blob
//       const pdfFile = new File([pdfBlob], fileName, {
//         type: "application/pdf",
//       });

//       // Append File object to formData
//       formData.append(formDataKey, pdfFile);
//       return formData;
//     }

//     // If neither download nor formData is provided, return the PDF blob
//     return pdf.output("blob");
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     return formData || null;
//   } finally {
//     setIsGenerating(false);
//   }
// };

export const generatePDF = async ({
  elementRef,
  formData,
  formDataKey = "document",
  download = false,
  fileName = "Rafeeqi_Travel_Document.pdf",
  extraHeight = 0,
  setIsGenerating,
}) => {
  if (!elementRef.current) return formData || null;

  try {
    setIsGenerating(true);

    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas-pro")).default;

    const content = elementRef.current;

    // Hide screen watermark before PDF generation
    const screenWatermark = content.querySelector(".screen-watermark");
    if (screenWatermark) {
      screenWatermark.style.display = "none";
    }

    // Get watermark (image or text) from element (before hiding)
    let watermarkEl =
      content.querySelector('[style*="rotate(45deg)"]') ||
      content.querySelector('[style*="rotate(-45deg)"]');

    // If not found, try to find in screen-watermark
    if (!watermarkEl && screenWatermark) {
      watermarkEl =
        screenWatermark.querySelector('[style*="rotate"]') ||
        screenWatermark.querySelector("div");
    }

    const watermarkImg = watermarkEl?.querySelector("img");
    // IMPORTANT: Do NOT use default "RAFEEQI" if no watermark element exists.
    // If nothing is found, keep it empty so no watermark is drawn.
    const watermarkText = watermarkEl?.textContent?.trim() || "";
    const watermarkImageSrc =
      watermarkImg?.src || watermarkImg?.getAttribute("src");

    // Take full screenshot
    const fullCanvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: content.offsetWidth,
      height: content.scrollHeight + extraHeight,
    });

    // PDF setup
    const pdf = new jsPDF("p", "mm", "a3"); // Portrait, mm, A3
    const pdfWidth = 297;
    const pdfHeight = 420;
    const padding = 10;

    // Function to add watermark to current page (supports both image and text)
    const addWatermark = async () => {
      // If there is no watermark image and no watermark text, skip drawing watermark
      if (!watermarkImageSrc && !watermarkText) {
        return;
      }

      pdf.saveGraphicsState();
      pdf.setGState(pdf.GState({ opacity: 0.03 }));

      if (watermarkImageSrc) {
        // Add image watermark
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = watermarkImageSrc;
          });

          // Create canvas to rotate image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Match screen size: w-96 h-96 (384px) with scale(1.5) = 576px
          // Convert to mm for PDF: 576px at 96 DPI = ~152mm
          const screenSizePx = 768; // w-96 h-96 in Tailwind
          const screenScale = 1.5; // scale(1.5) from screen
          const scaledSizePx = screenSizePx * screenScale;
          const baseSizeInMm = (scaledSizePx / 96) * 25.4; // ~152mm

          // Calculate scaled image dimensions
          const scaledImgWidth = img.width * screenScale;
          const scaledImgHeight = img.height * screenScale;

          // Canvas size should accommodate rotated and scaled image
          const diagonal = Math.sqrt(
            scaledImgWidth ** 2 + scaledImgHeight ** 2
          );
          const canvasSize = Math.ceil(diagonal * 1.2); // Add padding
          canvas.width = canvasSize;
          canvas.height = canvasSize;

          // Rotate and draw scaled image (top-left to bottom-right = -45deg)
          ctx.translate(canvasSize / 2, canvasSize / 2);
          ctx.rotate((45 * Math.PI) / 180);
          ctx.drawImage(
            img,
            -scaledImgWidth / 2,
            -scaledImgHeight / 2,
            scaledImgWidth,
            scaledImgHeight
          );

          // Use same size as screen, maintaining aspect ratio
          const imgWidth = baseSizeInMm;
          const imgHeight = (img.height / img.width) * baseSizeInMm;
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;

          pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            x,
            y,
            imgWidth,
            imgHeight
          );
        } catch (err) {
          console.error("Error loading watermark image:", err);
          // Fallback to text if image fails
          pdf.setTextColor(128, 128, 128);
          pdf.setFontSize(128);
          pdf.setFont("helvetica", "bold");
          pdf.text(watermarkText, pdfWidth / 2, pdfHeight / 2, {
            align: "center",
            angle: -45,
          });
        }
      } else {
        // Add text watermark
        pdf.setTextColor(128, 128, 128);
        pdf.setFontSize(128);
        pdf.setFont("helvetica", "bold");
        pdf.text(watermarkText, pdfWidth / 2, pdfHeight / 2, {
          align: "center",
          angle: -45,
        });
      }

      pdf.restoreGraphicsState();
    };

    const usableWidth_mm = pdfWidth - padding * 2;
    const usableHeight_mm = pdfHeight - padding * 2;

    const imgWidth_px = fullCanvas.width;
    const imgHeight_px = fullCanvas.height;

    // Convert pixels → mm ratio
    const pxToMmRatio = usableWidth_mm / imgWidth_px;

    // Maximum slice height per page (px)
    const sliceHeight_px = usableHeight_mm / pxToMmRatio - 5; // safe margin
    const overlap_px = 5; // small overlap to prevent cut

    let renderedHeight = 0;
    let isFirstPage = true;

    // Check if content fits on a single page
    const contentFitsOnOnePage = imgHeight_px <= sliceHeight_px;

    // Function to check if content is just whitespace/padding
    // Returns true ONLY if content is truly whitespace, false if there's any actual content
    const isContentWhitespace = (startY, height) => {
      // If height is too small to check accurately, assume it's content (don't skip)
      if (height < 3) return false;

      try {
        // Sample pixels from the section
        const ctx = fullCanvas.getContext("2d");
        const imageData = ctx.getImageData(
          0,
          startY,
          fullCanvas.width,
          Math.min(height, 200) // Check up to 200px for better accuracy
        );
        const pixels = imageData.data;

        let whitePixelCount = 0;
        let totalPixels = 0;
        const threshold = 250; // Consider pixel white if RGB > 250 (almost white)

        // Check every 10th pixel for performance
        for (let i = 0; i < pixels.length; i += 40) {
          // RGBA = 4 bytes, so 40 = every 10th pixel
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          totalPixels++;

          // Check if pixel is white or very light (background color)
          if (r > threshold && g > threshold && b > threshold) {
            whitePixelCount++;
          }
        }

        const whitePercentage = (whitePixelCount / totalPixels) * 100;

        // Only consider it whitespace if 99%+ pixels are white (very strict)
        // This ensures we don't skip pages with actual content
        return whitePercentage > 99;
      } catch (error) {
        console.error("Error checking whitespace:", error);
        return false; // On error, assume it's content (don't skip)
      }
    };

    // Use a more robust loop condition that accounts for floating point precision
    while (renderedHeight < imgHeight_px - 0.1) {
      const remainingPx = imgHeight_px - renderedHeight;

      // Break early if remaining content is too small (less than 0.5px - truly nothing left)
      if (remainingPx < 0.5) {
        break;
      }

      // CRITICAL FIX: If content fits on one page and we've already rendered the first page, break immediately
      // This prevents the loop from running a second time and creating a blank page
      if (contentFitsOnOnePage && !isFirstPage) {
        break;
      }

      // Calculate slice height for the next page
      let sliceHeight = Math.min(sliceHeight_px, remainingPx);

      // For subsequent pages (not first page), check if the slice contains only whitespace
      // If it's whitespace, skip it. If it has content, ALWAYS render it (no matter how small)
      if (!isFirstPage && sliceHeight > 0.5) {
        const isSliceWhitespace = isContentWhitespace(
          renderedHeight,
          sliceHeight
        );
        if (isSliceWhitespace) {
          // Skip this whitespace slice - don't create a page for it
          renderedHeight += sliceHeight;
          continue; // Move to next iteration
        }
        // If slice has content, continue to render it (don't break)
      }

      // Create canvas slice
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext("2d");

      ctx.drawImage(
        fullCanvas,
        0,
        renderedHeight - (renderedHeight === 0 ? 0 : overlap_px),
        pageCanvas.width,
        pageCanvas.height + (renderedHeight === 0 ? 0 : overlap_px),
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      const imgData = pageCanvas.toDataURL("image/png");

      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      const imageHeight_mm = pageCanvas.height * pxToMmRatio;

      pdf.addImage(
        imgData,
        "PNG",
        padding,
        padding,
        usableWidth_mm,
        imageHeight_mm
      );

      // Add watermark to current page
      await addWatermark();

      renderedHeight += sliceHeight; // increment by actual slice height

      // Calculate what would remain after this slice
      const wouldRemain = imgHeight_px - renderedHeight;

      // Break if we've rendered all content (account for floating point precision)
      if (renderedHeight >= imgHeight_px - 0.1) {
        break;
      }

      // Check if remaining content after this page is only whitespace
      // If yes, we can break. If no, continue to render it.
      if (wouldRemain > 0.5) {
        const isRemainingWhitespace = isContentWhitespace(
          renderedHeight,
          wouldRemain
        );
        if (isRemainingWhitespace) {
          // All remaining content is whitespace, we're done
          break;
        }
        // If remaining has content, continue loop to render it
      } else {
        // Less than 0.5px remaining, we're done
        break;
      }

      // Additional safety: if content fits on one page, we're definitely done after first page
      if (contentFitsOnOnePage) {
        break;
      }
    }

    // Download PDF
    if (download) {
      pdf.save(fileName);
      return formData;
    }

    // Append to FormData
    if (formData) {
      const blob = pdf.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });
      formData.append(formDataKey, file);
      return formData;
    }

    return pdf.output("blob");
  } catch (err) {
    console.error("PDF Error:", err);
    return formData || null;
  } finally {
    // Restore screen watermark visibility
    if (elementRef.current) {
      const screenWatermark =
        elementRef.current.querySelector(".screen-watermark");
      if (screenWatermark) {
        screenWatermark.style.display = "";
      }
    }
    setIsGenerating(false);
  }
};
