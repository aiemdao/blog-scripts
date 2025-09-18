/* ---------- Helpers ---------- */
function collapseWhitespace(s){ return s.replace(/\s+/g,' ').trim(); }
function rstripPunct(s){ return s.replace(/[ \t\r\n]+$/,'').replace(/[ .;:-]+$/,''); }
function cleanNumberStrPreserveSigns(s) {
  if (!s) return "";
  s = s.trim();
  if (s.startsWith('<') || s.startsWith('>')) return s;
  const v = parseFloat(s);
  if (Number.isNaN(v)) return s;
  return Number.isInteger(v) ? String(parseInt(v)) : String(v);
}

/* ---------- Blood (sửa all_tests: không loại trừ trùng lặp) ---------- */
function extractBloodResults(text, allTests=false) {
  const hb = [...text.matchAll(/Huyết\s*sắc\s*tố\s*\(Hemoglobin\)\s*([<>]?\d+\.?\d*)\s*g\/L/gi)].map(m=>m[1]);
  const wbc = [...text.matchAll(/Số\s*lượng\s*Bạch\s*cầu\s*\(WBC\)\s*([<>]?\d+\.?\d*)\s*G\/L/gi)].map(m=>m[1]);
  const plt = [...text.matchAll(/Số\s*lượng\s*tiểu\s*cầu.*?([<>]?\d+\.?\d*)\s*G\/L/gi)].map(m=>m[1]);
  const ml1 = [...text.matchAll(/Máu\s*lắng\s*giờ\s*1\s*\(ML_1\)\s*([<>]?\d+\.?\d*)\s*mm/gi)].map(m => m[1]);
  const ml2 = [...text.matchAll(/Máu\s*lắng\s*giờ\s*2\s*\(ML_2\)\s*([<>]?\d+\.?\d*)\s*mm/gi)].map(m => m[1]);

  function formatRange(vals, unit) {
    if (!vals || vals.length === 0) return "";
    if (!allTests) return cleanNumberStrPreserveSigns(vals[0]) + unit; // Chỗ này để thế này đúng rồi, phần tử gặp đầu tiên là mới nhất
    // allTests = true -> GIỮ nguyên tất cả giá trị theo thứ tự xuất hiện (không loại trừ trùng lặp)
    if (vals.length === 1) return cleanNumberStrPreserveSigns(vals[0]) + unit;
    const joined = vals.slice().reverse().map(v => cleanNumberStrPreserveSigns(v)).join("-->");
    return joined + unit;
  }

  const parts = [];
  if (hb.length) parts.push("Hb: " + formatRange(hb, "g/L"));
  if (wbc.length) parts.push("BC: " + formatRange(wbc, "G/L"));
  if (plt.length) parts.push("TC: " + formatRange(plt, "G/L"));
  if (ml1.length && ml2.length) parts.push("Máu lắng: " + cleanNumberStrPreserveSigns(ml1[0]) + "/" + cleanNumberStrPreserveSigns(ml2[0]) + "mm");
  return parts.join("   ");
}

/* ---------- Biochemistry (giữ nguyên logic Python, hỗ trợ < and >) ---------- */
function extractBiochemistryResults(text, allTests=false) {
  function findAll(re) {
    const res=[]; const rex = new RegExp(re.source, re.flags.includes('g')?re.flags:re.flags+'g');
    let m;
    while ((m = rex.exec(text)) !== null) res.push(m[1]);
    return res;
  }
  function fmt_list(vals) {
    if (!vals || vals.length === 0) return "";
    // giữ thứ tự xuất hiện (để giống nguyên bản Python về cách xử lý giá trị thời gian)
    const vals_ordered = vals.slice();
    if (!allTests) return cleanNumberStrPreserveSigns(vals_ordered[0]);
    return vals.slice().reverse().map(v=>cleanNumberStrPreserveSigns(v)).join("-->")
  }

  const ast_list = findAll(/Đo hoạt độ AST \(GOT\) \[Máu\]\s*([<>\d\.]+)/i);
  const alt_list = findAll(/Đo hoat độ ALT \(GPT\) \[Máu\]\s*([<>\d\.]+)/i);
  const cre_list = findAll(/Định lượng Creatinin \[Máu\]\s*([<>\d\.]+)/i);
  const ck_list  = findAll(/Đo hoạt độ CK \(Creatine kinase\) \[Máu\]\s*([<>\d\.]+)/i);
  const tnt_list = findAll(/Định lượng Troponin T \[Máu\](?:\([^)]+\))?\s*([<>\d\.]+)/i);
  const bnp_list = findAll(/Định lượng ProBNP \(NTproBNP\)\s*\[Máu\]\s*([<>\d\.]+)/i);
  const glu_list = findAll(/Định lượng Glucose \[Máu\]\s*([<>\d\.]+)/i);
  const hba1c_list = findAll(/Định lượng HbA1c \[Máu\]\s*([<>\d\.]+)/i);
  const ca_list = findAll(/Định lượng Calci toàn phần \[Máu\]\s*([<>\d\.]+)/i);
  const alp_list = findAll(/Đo hoạt độ ALP \(Alkalin Phosphatase\) \[Máu\]\s*([<>\d\.]+)/i);
  const alb_list = findAll(/Định lượng Albumin \[Máu\]\s*([<>\d\.]+)/i);
  const protein_list = findAll(/Định lượng Protein toàn phần \[Máu\]\s*([<>\d\.]+)/i);
  const crp_list = findAll(/Định lượng CRP hs \(CRP high sesitive\) \[Máu\]\s*([<>\d\.]+)/i);
  const rf_list = findAll(/Định lượng RF \(Reumatoid Factor\) \[Máu\]\s*([<>\d\.]+)/i);
  const anti_ccp_list = findAll(/Định lượng Anti\s*-\s*CCP \[Máu\]\s*([<>\d\.]+)/i);
  const pct_list = findAll(/Định lượng Pro-?calcitonin \[Máu\]\s*([<>\d\.]+)/i);
  const ft4_list = findAll(/Định lượng FT4 \(Free Thyroxine\) \[Máu\]\s*([<>\d\.]+)/i);
  const tsh_list = findAll(/Định lượng TSH \(Thyroid Stimulating hormone\) \[Máu\]\s*([<>\d\.]+)/i);
  const cortisol_list = findAll(/Định lượng Cortisol\s*\(Máu\)\s*([<>\d\.]+)/i);
  const acth_list = findAll(/Định lượng ACTH \(Adrenocorticotropi hormone\)\s*\[Máu\]\s*([<>\d\.]+)/i);
  const hbsag_list = findAll(/HBsAg\s*miễn\s*dịch\s*tự\s*động\s*[\d\.,]+\s*\(([^)]+)\)/i);
  const hcvab_list = findAll(/Anti\s*HCV\s*miễn\s*dịch\s*tự\s*động\s*[\d\.,]+\s*\(([^)]+)\)/i);
  const qft_list = findAll(/Mycobacterium\s*tuberculosis\s*Quantiferon\s*([A-Za-zÀ-ỹ]+)/i);
  const uric_list = findAll(/Định lượng Acid Uric \[Máu\]\s*([<>\d\.]+)/i);
  const chol_list = findAll(/Định lượng Cholesterol \[Máu\]\s*([<>\d\.]+)/i);
  const tg_list   = findAll(/Định lượng Triglyceride \[Máu\]\s*([<>\d\.]+)/i);
  const hdl_list  = findAll(/Định lượng HDL-C.*\[Máu\]\s*([<>\d\.]+)/i);
  const ldl_list  = findAll(/Định lượng LDL-C.*\[Máu\]\s*([<>\d\.]+)/i);
  const vitd3_list = findAll(/Định lượng 25OH Vitamin D \(D3\) \[Máu\]\s*([<>\d\.]+)/i);

  const parts=[];
  if (ast_list.length || alt_list.length) {
    const ast_s = fmt_list(ast_list), alt_s = fmt_list(alt_list);
    if (ast_s && alt_s) parts.push(`AST/ALT: ${ast_s}/${alt_s}U/L`);
    else if (ast_s) parts.push(`AST: ${ast_s}U/L`);
    else if (alt_s) parts.push(`ALT: ${alt_s}U/L`);
  }
  if (cre_list.length) parts.push(`Creatinin: ${fmt_list(cre_list)}µmol/L`);
  if (ck_list.length) parts.push(`CK: ${fmt_list(ck_list)}U/L`);
  if (tnt_list.length) parts.push(`TnThs: ${fmt_list(tnt_list)}ng/L`);
  if (bnp_list.length) parts.push(`BNP: ${fmt_list(bnp_list)}pg/mL`);
  if (glu_list.length) parts.push(`Glucose: ${fmt_list(glu_list)}mmol/L`);
  if (hba1c_list.length) parts.push(`HbA1c: ${fmt_list(hba1c_list)}%`);
  if (ca_list.length) parts.push(`Ca: ${fmt_list(ca_list)} mmol/L`);
  if (alp_list.length) parts.push(`ALP: ${fmt_list(alp_list)}U/L`);
  if (alb_list.length) parts.push(`Alb: ${fmt_list(alb_list)}g/L`);
  if (protein_list.length) parts.push(`Protein: ${fmt_list(protein_list)}g/L`);
  if (crp_list.length) parts.push(`CRP: ${fmt_list(crp_list)}mg/dL`);
  if (rf_list.length) parts.push(`RF: ${fmt_list(rf_list)}IU/mL`);
  if (anti_ccp_list.length) parts.push(`Anti-CCP: ${fmt_list(anti_ccp_list)}U/mL`);
  if (pct_list.length) parts.push(`PCT: ${fmt_list(pct_list)}ng/mL`);
  if (ft4_list.length) parts.push(`FT4: ${fmt_list(ft4_list)}pmol/L`);
  if (tsh_list.length) parts.push(`TSH: ${fmt_list(tsh_list)}µlU/ml`);
  if (cortisol_list.length) parts.push(`Cortisol: ${fmt_list(cortisol_list)}nmol/L`);
  if (acth_list.length) parts.push(`ACTH: ${fmt_list(acth_list)}pg/mL`);
  if (hbsag_list.length) parts.push(`HBsAg: ${fmt_list(hbsag_list)}`);
 if (hcvab_list.length) parts.push(`HCV Ab: ${fmt_list(hcvab_list)}`);
 if (qft_list.length) parts.push(`Quantiferon: ${fmt_list(qft_list)}`);
  if (uric_list.length) parts.push(`Uric: ${fmt_list(uric_list)}µmol/L`);
  if (chol_list.length) parts.push(`Cholesterol: ${fmt_list(chol_list)}mmol/L`);
  if (tg_list.length)   parts.push(`TG: ${fmt_list(tg_list)}mmol/L`);
  if (hdl_list.length)  parts.push(`HDL: ${fmt_list(hdl_list)}mmol/L`);
  if (ldl_list.length)  parts.push(`LDL: ${fmt_list(ldl_list)}mmol/L`);
  if (vitd3_list.length) parts.push(`Vitamin D3: ${fmt_list(vitd3_list)}ng/mL`);
  
  return parts.join("   ");
}

/* ---------- Coagulation (sửa all_tests: không loại trừ trùng lặp) ---------- */
function extractCoagulationResults(text, allTests=false) {
  function findAll(re) {
    const res=[]; const rex = new RegExp(re.source, re.flags.includes('g')?re.flags:re.flags+'g');
    let m;
    while ((m = rex.exec(text)) !== null) res.push(m[1]);
    return res;
  }
  function formatVals(vals, unit) {
    if (!vals || vals.length===0) return "";
    if (!allTests) return cleanNumberStrPreserveSigns(vals[0]) + unit;
    if (vals.length===1) return cleanNumberStrPreserveSigns(vals[0]) + unit;
    return vals.slice().reverse().map(v=>cleanNumberStrPreserveSigns(v)).join("-->") + unit;
  }

  const pt_time = findAll(/Thời gian Prothrombin \(PT\)\s*([<>\d\.]+)/i);
  const pt_percent = findAll(/Tỷ lệ Prothrombin.*?(\d+\.?\d*)\s*%/i);
  const inr = findAll(/INR[^0-9]*(\d+\.?\d*)/i);
  const aptt = findAll(/Thời gian Thromboplastin hoạt hóa từng phần \(APTT\)\s*([<>\d\.]+)/i);
  const fibrinogen = findAll(/Fibrinogen.*?(\d+\.?\d*)\s*g\/L/is);

  const parts=[];
  if (pt_time.length) parts.push("PT: " + formatVals(pt_time, "s"));
  if (pt_percent.length) parts.push("PT%: " + formatVals(pt_percent, "%"));
  if (inr.length) parts.push("INR: " + formatVals(inr, ""));
  if (aptt.length) parts.push("APTT: " + formatVals(aptt, "s"));
  if (fibrinogen.length) parts.push("Fibrinogen: " + formatVals(fibrinogen, " g/L"));

  return parts.join("   ");
}

/* ---------- Imaging (gồm luôn siêu âm tim) ---------- */
function extractImagingResults(text) {
  const results = [];
  const phiPattern = /PHIẾU\s+KHÁM\s+SIÊU\s+ÂM/gi;
  const ketPatterns = [ /Kết\s*Luận\s*[:\-]?/gi, /Ket\s*Luan\s*[:\-]?/gi ];
  const services = ["Siêu âm ổ bụng","Siêu âm tuyến giáp","Siêu âm phần mềm","Siêu âm tim","Siêu âm khớp"];

  // Các loại siêu âm thường
  for (const svc of services) {
    const svcRegex = new RegExp('Dịch\\s*vụ\\s*:\\s*' + svc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
    let svcMatch;
    while ((svcMatch = svcRegex.exec(text)) !== null) {
      const svcPos = svcMatch.index;
      const p_m = (()=>{ let last=null,m; const re=new RegExp(phiPattern.source,'gi'); while((m=re.exec(text))!==null){if(m.index<svcPos) last=m; else break;} return last;})();
      if (!p_m) continue;
      const p_start = p_m.index;
      let k_m=null;
      for (const kp of ketPatterns) {
        const re=new RegExp(kp.source,'gi'); let last=null,m;
        while((m=re.exec(text))!==null){ if(m.index<p_start) last=m; else break; }
        if (last) {k_m=last; break;}
      }
      if (!k_m) continue;
      const concl_raw = text.substring(k_m.index + k_m[0].length, p_start);
      let concl = collapseWhitespace(concl_raw);
      concl = rstripPunct(concl);
      if (concl) results.push(`${svc}: ${concl}`);
    }
  }

  // Thêm xử lý riêng cho Siêu âm Doppler tim
  const svcPattern = /Dịch\s*vụ\s*:\s*Siêu âm Doppler tim/gi;
  const ketPattern = /KẾT\s*LUẬN\s*[:\-]?/gi;
  const namePattern = /Họ\s*và\s*tên/gi;
  let svcMatch;
  while ((svcMatch = svcPattern.exec(text)) !== null) {
    const svcPos = svcMatch.index;
    const nameMatches=[]; { const re=new RegExp(namePattern.source,'gi'); let m; while((m=re.exec(text))!==null){if(m.index<svcPos) nameMatches.push(m); else break;} }
    if (nameMatches.length===0) continue;
    const namePos = nameMatches[nameMatches.length-1].index;
    const ketMatches=[]; { const re=new RegExp(ketPattern.source,'gi'); let m; while((m=re.exec(text))!==null){if(m.index<namePos) ketMatches.push(m); else break;} }
    if (ketMatches.length===0) continue;
    const ketPosEnd = ketMatches[ketMatches.length-1].index + ketMatches[ketMatches.length-1][0].length;
    const concl_raw = text.substring(ketPosEnd, namePos);
	let concl = collapseWhitespace(concl_raw).replace(/^-+/, "").trim();
	concl = rstripPunct(concl);
	if (concl) results.push("Siêu âm tim: " + concl);
  }

  return results.join("\n");
}
/*-----------Xquang-------------------*/
function extractXquang(text) {
  const results = [];
  const serviceRe = /Dịch\s*vụ:\s*XQ/gi;

  let svcMatch;
  while ((svcMatch = serviceRe.exec(text)) !== null) {
    const start = svcMatch.index;

    // Cắt đoạn từ dịch vụ XQ đến "Số tổng đài"
    const endMatch = /Số\s*tổng\s*đài:/gi.exec(text.substring(start));
    if (!endMatch) continue;
    const block = text.substring(start, start + endMatch.index);

    // Lấy tên kỹ thuật Xquang (giữa "Chụp" và "thẳng")
    let xq_name = "";
    const techMatch = /KỸ\s*THUẬT:\s*Chụp\s+(.+?)\s+thẳng/i.exec(block);
    if (techMatch) {
      xq_name = collapseWhitespace(techMatch[1]).trim();
      xq_name = rstripPunct(xq_name);
    }

    // Lấy kết quả giữa "KẾT LUẬN:" và "Số tổng đài:"
    let concl = "";
    const conclMatch = /KẾT\s*LUẬN:\s*([\s\S]+)/i.exec(block);
    if (conclMatch) {
      concl = conclMatch[1];
      concl = collapseWhitespace(concl).trim();
      concl = concl.replace(/Số\s*tổng\s*đài.*$/i, ""); // cắt phần sau nếu còn sót
      concl = rstripPunct(concl).trim();
    }

    if (xq_name && concl) {
      results.push(`${xq_name}: ${concl}`);
    }
  }

  return results.join("\n");
}


/* ---------- CT ngực (giữ nguyên logic) ---------- */
function extractCTScan(text) {
  const svcRe = /Dịch\s*vụ\s*:\s*CT lồng ngực 16 dãy \[không tiêm\]/i;
  const svcMatch = svcRe.exec(text);
  if (!svcMatch) return "";
  const startPos = svcMatch.index + svcMatch[0].length;
  const snippet = text.substring(startPos);
  const conclRe = /KẾT LUẬN:(.*?)Số tổng đài: 19006422/si;
  const m = conclRe.exec(snippet);
  if (m && m[1]) return "CT ngực: " + collapseWhitespace(m[1]);
  return "";
}
/*--------------MRI------------*/
function extractMRI(text) {
  const results = [];

  // Regex để tìm tất cả block MRI (bắt đầu từ "Dịch vụ: MR" đến "Số tổng đài")
  const serviceRe = /Dịch\s*vụ:\s*MR[^\n]+/gi;
  let svcMatch;

  while ((svcMatch = serviceRe.exec(text)) !== null) {
    const start = svcMatch.index;

    // tìm "Số tổng đài:" gần nhất phía sau
    const after = text.substring(start);
    const endMatch = /Số\s*tổng\s*đài:/i.exec(after);
    if (!endMatch) continue;
    const block = after.substring(0, endMatch.index);

    const svcLine = svcMatch[0];

    // ==== TRƯỜNG HỢP MRI CS NGỰC ====
    if (/MR\s*CS\s*ngực/i.test(svcLine)) {
      const ketMatch = /KẾT\s*LUẬN\s*[:\-]?([\s\S]+)/i.exec(block);
      if (ketMatch) {
        let concl_raw = ketMatch[1];
        concl_raw = concl_raw.replace(/Số\s*tổng\s*đài.*$/i, "");
        let concl = collapseWhitespace(concl_raw).trim();
        concl = rstripPunct(concl).trim();
        if (concl) results.push(`MRI cột sống ngực: ${concl}`);
      }

    // ==== TRƯỜNG HỢP MRI KHỚP ====
    } else if (/MR\s*khớp/i.test(svcLine)) {
      const ketMatch = /KẾT\s*LUẬN\s*[:\-]?([\s\S]+)/i.exec(block);
      if (ketMatch) {
        let concl_raw = ketMatch[1];
        concl_raw = concl_raw.replace(/Số\s*tổng\s*đài.*$/i, "");
        let concl = collapseWhitespace(concl_raw).trim();
        concl = rstripPunct(concl).trim();
        if (concl) results.push(concl); // dùng nguyên văn
      }
    }
  }

  return results.join("\n");
}


/*----------- Thăm dò chức năng ------------*/
function extractCNHH(text) {
  const svcPattern = /PHIẾU\s+ĐO\s+CHỨC\s+NĂNG\s+HÔ\s+HẤP/gi;
  const ketPattern = /KẾT\s*LUẬN\s*/gi;
  let results = [];

  let svcMatch;
  while ((svcMatch = svcPattern.exec(text)) !== null) {
    const svcPos = svcMatch.index;
    // tìm KẾT LUẬN gần nhất trước svcPos
    let ketMatch = null;
    let m;
    while ((m = ketPattern.exec(text)) !== null) {
      if (m.index < svcPos) ketMatch = m;
      else break;
    }
    if (!ketMatch) continue;
    const concl_raw = text.substring(ketMatch.index + ketMatch[0].length, svcPos);
    let concl = collapseWhitespace(concl_raw);
    concl = rstripPunct(concl).trim();
    if (concl) results.push("Đo chức năng hô hấp: " + concl);
  }
  return results.join("\n");
}
function extractDienCo(text) {
  const svcPattern = /KẾT\s+QUẢ\s+ĐIỆN\s+SINH\s+LÝ\s+THẦN\s+KINH\s*-\s*CƠ/gi;
  const ketPattern = /Kết\s*luận\s*/gi;
  let results = [];

  let svcMatch;
  while ((svcMatch = svcPattern.exec(text)) !== null) {
    const svcPos = svcMatch.index;
    // tìm Kết luận gần nhất trước svcPos
    let ketMatch = null;
    let m;
    while ((m = ketPattern.exec(text)) !== null) {
      if (m.index < svcPos) ketMatch = m;
      else break;
    }
    if (!ketMatch) continue;
    const concl_raw = text.substring(ketMatch.index + ketMatch[0].length, svcPos);
    let concl = collapseWhitespace(concl_raw);
    concl = rstripPunct(concl).trim();
    if (concl) results.push("Điện cơ: " + concl);
  }
  return results.join("\n");
}
function extractDXA(text) {
  // cổ xương đùi trái
  const cxdtMatch = /Vùng\s+cổ\s+xương\s+đùi\s+trái\s+[0-9\.\s\-]+?(-?\d+\.\d+)\s+[0-9\.\s\-]+?Toàn bộ đầu trên xương đùi bên trái/i.exec(text);
  const dxa_cxdt = cxdtMatch ? cxdtMatch[1] : null;

  // cổ xương đùi phải
  const cxdpMatch = /Vùng\s+cổ\s+xương\s+đùi\s+phải\s+[0-9\.\s\-]+?(-?\d+\.\d+)\s+[0-9\.\s\-]+?Toàn bộ đầu trên xương đùi bên phải/i.exec(text);
  const dxa_cxdp = cxdpMatch ? cxdpMatch[1] : null;

  // cột sống thắt lưng 
  let dxa_cstl = null;
  const ketRe = /KẾT\s*LUẬN/gi;
  let ketMatch;
  while ((ketMatch = ketRe.exec(text)) !== null) {
    const ketPos = ketMatch.index;
    // tìm lần xuất hiện "Trung bình cột sống thắt lưng" gần nhất trước ketPos
    const tRe = /Đốt\s+sống\s+thắt\s+lưng\s+trung\s+bình\s+L1-L4\s+[0-9.\s-]+?(-?\d+\.\d+)/i.exec(text);
    let last = null;
    let tMatch;
    while ((tMatch = tRe.exec(text)) !== null) {
      if (tMatch.index < ketPos) last = tMatch;
      else break;
    }
    if (!last) continue; // không có phrase trước KẾT LUẬN hiện tại, thử KẾT LUẬN tiếp theo (nếu có)
    // lấy đoạn giữa phrase và KẾT LUẬN
    const sub = text.substring(last.index + last[0].length, ketPos);
    // lấy tất cả các số thực trong đoạn (bao gồm âm)
    const nums = Array.from(sub.matchAll(/-?\d+\.\d+/g)).map(m => m[0]);
    // chọn số thứ 2 nếu có (thường là T-score); nếu chỉ có 1 số thì dùng số đó
    if (nums.length >= 2) {
      dxa_cstl = nums[1];
      break;
    } else if (nums.length === 1) {
      dxa_cstl = nums[0];
      break;
    }
    // nếu không có số, tiếp tục kiểm KẾT LUẬN khác
  }

  if (dxa_cxdt || dxa_cxdp || dxa_cstl) {
    return `Mật độ xương: cổ xương đùi trái/phải: ${dxa_cxdt || "NA"}/${dxa_cxdp || "NA"}, cột sống thắt lưng: ${dxa_cstl || "NA"}`;
  }
  return "";
}



/* ---------- extract_all (giống filters.__init__) ---------- */
function extract_all(text, selections, all_tests=false) {
  const res={};
  if (selections.includes("blood")) {
    const r = extractBloodResults(text, all_tests);
    if (r) res["Công thức máu"] = r;
  }
  if (selections.includes("biochemistry")) {
    const r = extractBiochemistryResults(text, all_tests);
    if (r) res["Sinh hóa"] = r;
  }
  if (selections.includes("coagulation")) {
    const r = extractCoagulationResults(text, all_tests);
    if (r) res["Đông máu"] = r;
  }
  if (selections.includes("imaging")) {
    const r = extractImagingResults(text);
    if (r) res["Siêu âm"] = r;
  }
  if (selections.includes("xquang")) {
	  const r = extractXquang(text);
	  if (r) res["Xquang"] = r;
}
  if (selections.includes("ct")) {
    const r = extractCTScan(text);
    if (r) res["Kết quả CT"] = r;
  }
  if (selections.includes("mri")) {
  const r = extractMRI(text);
  if (r) res["MRI"] = r;
}
  if (selections.includes("functional")) {
  const funcResults = [];

  const r1 = extractCNHH(text);
  if (r1) funcResults.push(r1);

  const r2 = extractDienCo(text);
  if (r2) funcResults.push(r2);

  const r3 = extractDXA(text);
  if (r3) funcResults.push(r3);

  if (funcResults.length) {
    res["Thăm dò chức năng"] = funcResults.join("\n");
  }
}
  return res;
}

/* ---------- UI hook ---------- */
function runFilter() {
  const text = document.getElementById("inputText").value || "";
  const selections = [];
  if (document.getElementById("chkBlood").checked) selections.push("blood");
  if (document.getElementById("chkBio").checked) selections.push("biochemistry");
  if (document.getElementById("chkCoag").checked) selections.push("coagulation");
  if (document.getElementById("chkImg").checked) selections.push("imaging");
  if (document.getElementById("chkXQ").checked) selections.push("xquang");
  if (document.getElementById("chkCT").checked) selections.push("ct");
  if (document.getElementById("chkMRI").checked) selections.push("mri");
  if (document.getElementById("chkFunc").checked) selections.push("functional");
  const all_tests = document.getElementById("chkAll").checked;

  const results = extract_all(text, selections, all_tests);
  const outElem = document.getElementById("outputBox");
  if (Object.keys(results).length === 0) {
    outElem.innerText = "Không tìm thấy dữ liệu phù hợp.";
    return;
  }
  const blocks = [];
  for (const k of Object.keys(results)) blocks.push(k + ":\n" + results[k]);
  outElem.innerText = blocks.join("\n\n");
}
