/**
 * Online wedding invitation (thiệp cưới online): the couple's content, the chosen template and
 * which sections show. Stored as JSON on the wedding; validated here for both the API and UI.
 */

export const WALKTHROUGH_3D_IDS = [
  '3d-oai-huong',
  '3d-mua-dong-tuyet',
  '3d-mua-thu',
  '3d-ho-sen-hoa-dang',
  '3d-rung-thong',
  '3d-dem-trang',
  '3d-tren-may',
  '3d-vuon-hoa-dao',
  '3d-co-truyen',
  '3d-rap-cuoi',
  // Cổ Đô & Gia Tiên Việt (+11)
  '3d-hoang-thanh-hue',
  '3d-pho-hoi-den-long',
  '3d-dinh-lang-cay-da',
  '3d-trang-an-thuy-dinh',
  '3d-nhat-binh-cung-dinh',
  '3d-hang-thuan-chua-vang',
  '3d-rap-la-dua-mien-tay',
  '3d-cau-trau-que-huong',
  '3d-thang-long-hoang-kim',
  '3d-lua-ha-dong-son-do',
  '3d-ben-nuoc-con-do',
  // Vườn Hoa & Bốn Mùa (+8)
  '3d-doi-huong-duong',
  '3d-vuon-hong-co-phap',
  '3d-hoa-ban-tay-bac',
  '3d-thung-lung-cam-tu-cau',
  '3d-anh-dao-kyoto',
  '3d-canh-dong-cuc-hoa-mi',
  '3d-vuon-cam-dia-trung-hai',
  '3d-mua-hoa-phuong-do',
  // Biển Đảo & Hoàng Hôn (+11)
  '3d-bai-bien-hoang-hon',
  '3d-phu-quoc-ngoc-trai',
  '3d-ha-long-du-thuyen',
  '3d-santorini-vom-xanh',
  '3d-dao-san-ho-nang-vang',
  '3d-mui-ne-doi-cat-hong',
  '3d-maldives-cau-go',
  '3d-vach-da-bien-khoi',
  '3d-rung-dua-ben-tre',
  '3d-con-dao-sao-dem',
  '3d-ben-du-thuyen-champagne',
  // Rừng Núi & Sương Sớm (+10)
  '3d-sapa-may-nui',
  '3d-dalat-nha-kinh-hoa',
  '3d-thac-ban-gioc',
  '3d-doi-che-tan-cuong',
  '3d-thao-nguyen-xanh',
  '3d-rung-dom-dom',
  '3d-thung-lung-ruou-vang',
  '3d-ho-tuyen-lam',
  '3d-nui-tuyet-thuy-si',
  '3d-nha-go-bac-au',
  // Hồ Nước & Hoa Đăng (+9)
  '3d-song-hoai-tha-den',
  '3d-ho-guom-the-huc',
  '3d-venice-gondola',
  '3d-suoi-nguon-rung-truc',
  '3d-ho-thien-nga',
  '3d-dam-sen-trang',
  '3d-thuy-ta-cung-trang',
  '3d-ben-thuyen-hoa-tim',
  '3d-vuon-nuoc-zen',
  // Cổ Tích, Mây & Ngân Hà (+10)
  '3d-cuc-quang-bac-cuc',
  '3d-lau-dai-pha-le',
  '3d-ngan-ha-tinh-tu',
  '3d-nac-thang-thien-duong',
  '3d-khu-vuon-anh-trang',
  '3d-co-xe-co-tich',
  '3d-dao-noi-than-tien',
  '3d-cung-dien-anh-sang',
  '3d-mua-sao-bang',
  '3d-vuong-quoc-bang-gia',
  // Lâu Đài & Dạ Tiệc Thượng Lưu (+10)
  '3d-dai-sanh-pha-le',
  '3d-thanh-duong-gothic',
  '3d-cung-dien-versailles',
  '3d-vuon-tuong-la-ma',
  '3d-da-tiec-gatsby',
  '3d-biet-thu-ho-como',
  '3d-sanh-nhung-hoang-gia',
  '3d-lau-dai-bavaria',
  '3d-nha-hat-opera',
  '3d-san-trong-indochine',
  // Điện Ảnh, Ký Ức & Nghệ Thuật (+11)
  '3d-rap-chieu-phim',
  '3d-chuyen-tau-thanh-xuan',
  '3d-bao-tang-my-thuat',
  '3d-thu-vien-co-dien',
  '3d-phong-tra-jazz',
  '3d-san-ga-mua-dong',
  '3d-trien-lam-den-trang',
  '3d-tiem-dia-than',
  '3d-buu-dien-sai-gon',
  '3d-san-khau-broadway',
  '3d-xuong-ve-mau-nuoc',
  // Hiện Đại, Rooftop & Đô Thị (+10)
  '3d-rooftop-sai-gon',
  '3d-cau-anh-sao',
  '3d-trien-lam-kinh',
  '3d-penthouse-vo-cuc',
  '3d-pho-di-bo-neon',
  '3d-vuon-toi-gian-zen',
  '3d-studio-anh-sang',
  '3d-ca-phe-goc-pho',
  '3d-cau-rong-song-han',
  '3d-khong-gian-kien-truc',
] as const;

export type Walkthrough3DTemplateId = (typeof WALKTHROUGH_3D_IDS)[number];

const WALKTHROUGH_3D_SET = new Set<string>(WALKTHROUGH_3D_IDS);

export function isWalkthrough3DTemplate(id: unknown): id is Walkthrough3DTemplateId {
  return typeof id === 'string' && WALKTHROUGH_3D_SET.has(id);
}

export const INVITATION_TEMPLATE_IDS = [
  ...WALKTHROUGH_3D_IDS,
  'song-hy-do',
  'son-mai',
  'sen-hong',
  'toi-gian',
  'mau-nuoc',
  'la-xanh',
  'ren-co-dien',
  'baroque-vang',
  'hong-pastel',
  'tap-chi',
  'bien-xanh',
  'do-do',
  'hy-ngoc-bich',
  'hy-hoang-gia',
  'hy-hong-dao',
  'pho-hoi',
  'cua-son',
  'thiep-do-hy',
  'phuong-hoang',
  'do-hoang-kim',
  'tra-hong',
  'lich-do',
  'tem-hy',
  'hoang-thanh',
  'ao-dai-ngoc',
  'sen-trang',
  'den-long',
  'nhat-binh',
  'mau-don-tim',
  'xuan-hong',
  'la-bac',
  'dao-phai',
  'ngoc-loang',
  'oai-huong',
  'ngay-dep',
  'lich-hong',
  'phong-thu-hong',
  'hoa-dao',
  'mau-don-trang',
  'vuon-la',
  'tim-mong-mo',
  'voan-trang',
  'ba-vom',
  'tim-hoang-hon',
  'hen-uoc',
  'thu-tinh',
  'trang-den',
  'be-sua',
  'thanh-lich',
  'nua-trang',
  'rung-thong',
  'vogue-den',
  'tap-chi-hong',
  'seoul',
  'album-mini',
  'han-quoc',
  'phim-den-trang',
  'xanh-hien-dai',
  'mat-troi',
  'vong-tron-hong',
  've-may-bay',
  've-ra-dao',
  'rap-chieu',
  'bom-tan',
  'phim-han',
  'bao-hy',
  'nhat-bao',
  'trang-ram',
  'ngoc-luc-bao',
  'dem-ha',
  'nhung-den',
  'pha-le',
  'sai-gon-dem',
  'ngoc-trai',
  'phong-thu-navy',
  'champagne',
  'vom-vang',
  'thu-xua',
  'hoai-niem',
  'phim-xua',
  'tem-buu-dien',
  'dong-hoa',
  'mua-thu',
  'cong-torii',
  'thao-nguyen',
  'hoang-hon',
  'bau-troi',
  'so-bien',
  'gio-bien',
  'lich-xanh',
  'phong-thu-xanh',
  'ky-niem',
  'nang-ha',
  'bac-ha',
  've-hong',
  'tem-hong',
  'so-hong',
  'lich-cuoi',
  'i-love-you',
  'cam-dat',
] as const;

export type InvitationTemplateId = (typeof INVITATION_TEMPLATE_IDS)[number];

export type InvitationTemplateStyle =
  | 'thiep-3d'
  | 'truyen-thong'
  | 'lang-man'
  | 'hien-dai'
  | 'toi-gian'
  | 'sang-trong'
  | 'co-dien'
  | 'thien-nhien'
  | 'de-thuong';

export type Invitation2DTemplateStyle = Exclude<InvitationTemplateStyle, 'thiep-3d'>;

/** Gallery filter labels for 2D templates, in display order */
export const INVITATION_2D_STYLE_LABELS: Record<Invitation2DTemplateStyle, string> = {
  'truyen-thong': 'Truyền thống',
  'lang-man': 'Lãng mạn',
  'hien-dai': 'Hiện đại',
  'toi-gian': 'Tối giản',
  'sang-trong': 'Sang trọng',
  'co-dien': 'Cổ điển',
  'thien-nhien': 'Thiên nhiên',
  'de-thuong': 'Dễ thương',
};

/** Gallery filter labels, in display order */
export const INVITATION_STYLE_LABELS: Record<InvitationTemplateStyle, string> = {
  'thiep-3d': 'Thiệp 3D',
  ...INVITATION_2D_STYLE_LABELS,
};

export type Invitation3DCategory =
  | 'co-do-truyen-thong'
  | 'vuon-hoa-mua-xuan'
  | 'bien-dao-nhiet-doi'
  | 'rung-nui-suong-mai'
  | 'ho-nuoc-thuy-ta'
  | 'co-tich-ngan-ha'
  | 'lau-dai-chau-au'
  | 'dien-anh-nghe-thuat'
  | 'hien-dai-thanh-thi';

export const INVITATION_3D_CATEGORY_LABELS: Record<Invitation3DCategory, string> = {
  'co-do-truyen-thong': 'Cổ Đô & Gia Tiên',
  'vuon-hoa-mua-xuan': 'Vườn Hoa & Bốn Mùa',
  'bien-dao-nhiet-doi': 'Biển Đảo & Hoàng Hôn',
  'rung-nui-suong-mai': 'Rừng Núi & Sương Mai',
  'ho-nuoc-thuy-ta': 'Hồ Nước & Hoa Đăng',
  'co-tich-ngan-ha': 'Cổ Tích & Ngân Hà',
  'lau-dai-chau-au': 'Lâu Đài & Dạ Tiệc',
  'dien-anh-nghe-thuat': 'Điện Ảnh & Ký Ức',
  'hien-dai-thanh-thi': 'Rooftop & Đương Đại',
};

export interface InvitationTemplateMeta {
  id: InvitationTemplateId;
  nameVi: string;
  descriptionVi: string;
  /** Gallery filter */
  style: InvitationTemplateStyle;
  /** Sub-category for 3D walkthrough invitations */
  category3d?: Invitation3DCategory;
  /** Short camera choreography / layout badge for 3D cards */
  cameraTagVi?: string;
}

/** 100 templates. The first twelve are the originals (their ids are stored in existing invitations). */
export const INVITATION_TEMPLATES: InvitationTemplateMeta[] = [
  { id: 'song-hy-do', nameVi: 'Song Hỷ Đỏ', descriptionVi: 'Mái vòm đỏ với chữ Song Hỷ vàng kim, ảnh cưới trong khung vòm, phong bì đỏ mở ra như thiệp in.', style: 'truyen-thong' },
  { id: 'son-mai', nameVi: 'Sơn Mài Hồng Phúc', descriptionVi: 'Nền sơn mài đỏ thẫm, ảnh tròn viền vàng kim, góc hoạ tiết cung đình.', style: 'truyen-thong' },
  { id: 'sen-hong', nameVi: 'Sen Hồng', descriptionVi: 'Ảnh khung vòm cài hoa mẫu đơn, chữ viết tay hồng sen, nhẹ nhàng mà rất Việt.', style: 'truyen-thong' },
  { id: 'toi-gian', nameVi: 'Tối Giản', descriptionVi: 'Trắng ngà, chữ thanh mảnh, ảnh như trang tạp chí kiến trúc. Đẹp nhờ sự tiết chế.', style: 'toi-gian' },
  { id: 'mau-nuoc', nameVi: 'Hoa Hồng Màu Nước', descriptionVi: 'Loang màu nước hồng đào, ảnh oval cài hoa mẫu đơn, chữ viết tay bay bổng.', style: 'lang-man' },
  { id: 'la-xanh', nameVi: 'Lá Xanh Boho', descriptionVi: 'Ảnh cưới tràn màn hình giữa vườn xanh, chữ viết tay trắng, hợp tiệc ngoài trời.', style: 'thien-nhien' },
  { id: 'ren-co-dien', nameVi: 'Ren Cổ Điển', descriptionVi: 'Khung oval viền ren, ảnh tông nâu cổ điển, chữ Save the Date như thiệp thập niên 60.', style: 'co-dien' },
  { id: 'baroque-vang', nameVi: 'Baroque Hoàng Kim', descriptionVi: 'Ảnh đen trắng trong khung vàng kim, chữ viết tay hoàng gia, sang như dạ tiệc.', style: 'sang-trong' },
  { id: 'hong-pastel', nameVi: 'Hồng Pastel', descriptionVi: 'Ảnh polaroid dán băng keo, chấm bi hồng và trái tim. Trẻ trung, đáng yêu.', style: 'de-thuong' },
  { id: 'tap-chi', nameVi: 'Tạp Chí', descriptionVi: 'Như bìa tạp chí: ảnh cưới tràn viền, chữ LOVE khổng lồ, các mục đánh số.', style: 'hien-dai' },
  { id: 'bien-xanh', nameVi: 'Biển Xanh', descriptionVi: 'Ảnh biển tràn viền, chữ Save the Date viết tay trên nền trời, lịch cưới như vé tàu.', style: 'thien-nhien' },
  { id: 'do-do', nameVi: 'Đỏ Đô Thư Pháp', descriptionVi: 'Ảnh cưới cài trong phong bì đỏ rượu vang, dấu sáp vàng, nền giấy kem. Sang và ấm.', style: 'sang-trong' },
  { id: 'hy-ngoc-bich', nameVi: 'Song Hỷ Ngọc Bích', descriptionVi: 'Mái vòm xanh ngọc, chữ Hỷ vàng kim, ảnh áo dài phố Hội trong khung vòm.', style: 'truyen-thong' },
  { id: 'hy-hoang-gia', nameVi: 'Hỷ Hoàng Gia', descriptionVi: 'Áo Nhật Bình xanh lam, mái vòm hoàng gia và hoạ tiết mây cung đình.', style: 'truyen-thong' },
  { id: 'hy-hong-dao', nameVi: 'Hỷ Hồng Đào', descriptionVi: 'Chữ Hỷ trên mái vòm hồng đào, nhẹ nhàng cho đôi trẻ yêu nét truyền thống.', style: 'truyen-thong' },
  { id: 'pho-hoi', nameVi: 'Phố Hội', descriptionVi: 'Vàng tường Hội An, mái vòm và đèn lồng. Hợp đám cưới miền Trung.', style: 'truyen-thong' },
  { id: 'cua-son', nameVi: 'Cửa Son', descriptionVi: 'Ba ô cửa vòm như cổng nhà xưa, ba khoảnh khắc áo dài đỏ.', style: 'truyen-thong' },
  { id: 'thiep-do-hy', nameVi: 'Thiệp Đỏ Hỷ', descriptionVi: 'Nền đỏ son, chữ vàng, con dấu Song Hỷ đóng lên ảnh cưới.', style: 'truyen-thong' },
  { id: 'phuong-hoang', nameVi: 'Phượng Hoàng', descriptionVi: 'Đỏ rượu vang, ảnh khung vàng và dấu Hỷ. Sang mà vẫn ấm.', style: 'truyen-thong' },
  { id: 'do-hoang-kim', nameVi: 'Đỏ Hoàng Kim', descriptionVi: 'Áp phích đỏ vàng, hoạ tiết mây, hợp lễ ăn hỏi và vu quy.', style: 'truyen-thong' },
  { id: 'tra-hong', nameVi: 'Trà Hồng', descriptionVi: 'Ảnh lễ dâng trà tràn nửa trên, chữ ký tên và ngày cưới như trang sách.', style: 'truyen-thong' },
  { id: 'lich-do', nameVi: 'Lịch Đỏ', descriptionVi: 'Trang lịch tháng cưới, ngày lành khoanh tim đỏ.', style: 'truyen-thong' },
  { id: 'tem-hy', nameVi: 'Tem Thư Hỷ', descriptionVi: 'Ảnh cưới thành con tem, dấu bưu điện ghi ngày cưới, viền thư máy bay đỏ.', style: 'truyen-thong' },
  { id: 'hoang-thanh', nameVi: 'Hoàng Thành', descriptionVi: 'Ảnh tròn viền vàng như ngọc bội, hợp lễ cưới phong cách cung đình Huế.', style: 'truyen-thong' },
  { id: 'ao-dai-ngoc', nameVi: 'Áo Dài Ngọc', descriptionVi: 'Nền ngọc bích, ảnh áo dài trong khung vòm, chữ I Love You xếp dọc.', style: 'truyen-thong' },
  { id: 'sen-trang', nameVi: 'Sen Trắng', descriptionVi: 'Ảnh áo dài giữa đầm sen, khung lá xanh, nét thanh như tranh lụa.', style: 'truyen-thong' },
  { id: 'den-long', nameVi: 'Đèn Lồng', descriptionVi: 'Phố đèn lồng về đêm, nền xanh đêm và chữ vàng.', style: 'truyen-thong' },
  { id: 'nhat-binh', nameVi: 'Nhật Bình', descriptionVi: 'Ba ảnh áo Nhật Bình ghép như album nhỏ, hoạ tiết mây cung đình.', style: 'truyen-thong' },
  { id: 'mau-don-tim', nameVi: 'Mẫu Đơn Tím', descriptionVi: 'Khung vòm cài mẫu đơn thật, tông tím oải hương mơ màng.', style: 'lang-man' },
  { id: 'xuan-hong', nameVi: 'Xuân Hồng', descriptionVi: 'Hoa đào cài khung vòm, áo dài pastel, màu xuân ấm áp.', style: 'lang-man' },
  { id: 'la-bac', nameVi: 'Lá Bạc', descriptionVi: 'Nhành bạch đàn trên khung vòm, xanh khói dịu và chữ viết tay.', style: 'lang-man' },
  { id: 'dao-phai', nameVi: 'Đào Phai', descriptionVi: 'Loang màu đào, ảnh oval và cành hoa, nhẹ như sương sớm.', style: 'lang-man' },
  { id: 'ngoc-loang', nameVi: 'Xanh Ngọc Loang', descriptionVi: 'Màu nước xanh ngọc, lá bạch đàn và ảnh oval.', style: 'lang-man' },
  { id: 'oai-huong', nameVi: 'Oải Hương', descriptionVi: 'Tím oải hương, hoa mẫu đơn và ảnh oval giữa trời xanh.', style: 'lang-man' },
  { id: 'ngay-dep', nameVi: 'Ngày Đẹp', descriptionVi: 'Ngày cưới thành con số khổng lồ, ảnh cưới lấp đầy trong nét chữ.', style: 'lang-man' },
  { id: 'lich-hong', nameVi: 'Lịch Hồng', descriptionVi: 'Trang lịch hồng, ngày cưới đánh dấu bằng trái tim.', style: 'lang-man' },
  { id: 'phong-thu-hong', nameVi: 'Phong Thư Hồng', descriptionVi: 'Ảnh cưới cài trong phong bì hồng, dấu sáp và chữ viết tay.', style: 'lang-man' },
  { id: 'hoa-dao', nameVi: 'Hoa Đào', descriptionVi: 'Ảnh khung chữ nhật, ba góc cài hoa đào, dịu dàng và tinh tế.', style: 'lang-man' },
  { id: 'mau-don-trang', nameVi: 'Mẫu Đơn Trắng', descriptionVi: 'Mẫu đơn quanh khung ảnh, nền kem và chữ in nghiêng cổ điển.', style: 'lang-man' },
  { id: 'vuon-la', nameVi: 'Vườn Lá', descriptionVi: 'Lá bạch đàn ôm khung ảnh, xanh mát cho tiệc cưới ngoài vườn.', style: 'thien-nhien' },
  { id: 'tim-mong-mo', nameVi: 'Tím Mộng Mơ', descriptionVi: 'Ảnh tròn viền vàng trên nền tím phấn, chữ viết tay bay bổng.', style: 'lang-man' },
  { id: 'voan-trang', nameVi: 'Voan Trắng', descriptionVi: 'Ảnh như bản in viền trắng, ngày cưới trong huy hiệu tròn.', style: 'lang-man' },
  { id: 'ba-vom', nameVi: 'Ba Vòm Cửa', descriptionVi: 'Ba khung vòm như ô cửa nhà thờ, ba khoảnh khắc của ngày cưới.', style: 'lang-man' },
  { id: 'tim-hoang-hon', nameVi: 'Tím Hoàng Hôn', descriptionVi: 'Ba ô vòm hoàng hôn, tím và cam như bầu trời cuối ngày.', style: 'lang-man' },
  { id: 'hen-uoc', nameVi: 'Hẹn Ước', descriptionVi: 'Ảnh in viền trắng, huy hiệu ngày cưới hồng phấn, vé mời dễ thương.', style: 'lang-man' },
  { id: 'thu-tinh', nameVi: 'Thư Tình', descriptionVi: 'Con tem tình yêu, dấu bưu điện và viền thư máy bay như lá thư xưa.', style: 'co-dien' },
  { id: 'trang-den', nameVi: 'Trắng Đen', descriptionVi: 'Đen trắng tuyệt đối, chữ thanh mảnh, khoảng trắng rộng.', style: 'toi-gian' },
  { id: 'be-sua', nameVi: 'Be Sữa', descriptionVi: 'Tông be sữa, ảnh áo dài trắng bên tường cũ, tối giản mà có hồn.', style: 'toi-gian' },
  { id: 'thanh-lich', nameVi: 'Thanh Lịch', descriptionVi: 'Xanh khói, chữ Playfair, ảnh phố thị. Thanh lịch kiểu châu Âu.', style: 'toi-gian' },
  { id: 'nua-trang', nameVi: 'Nửa Trang', descriptionVi: 'Ảnh tràn nửa trên, tên và ngày cưới dàn trang như poster hiện đại.', style: 'hien-dai' },
  { id: 'rung-thong', nameVi: 'Rừng Thông', descriptionVi: 'Đồi thông Đà Lạt lúc hoàng hôn, chữ viết tay và màu ô liu.', style: 'thien-nhien' },
  { id: 'vogue-den', nameVi: 'Tạp Chí Đen Trắng', descriptionVi: 'Bìa tạp chí đen trắng, chữ LOVE khổng lồ và cuộn phim ảnh.', style: 'hien-dai' },
  { id: 'tap-chi-hong', nameVi: 'Tạp Chí Hồng', descriptionVi: 'Bìa tạp chí hồng phấn, ảnh tường hoa và các mục đánh số.', style: 'hien-dai' },
  { id: 'seoul', nameVi: 'Seoul Studio', descriptionVi: 'Ảnh studio phong cách Hàn, bìa tạp chí xanh khói tinh tế.', style: 'hien-dai' },
  { id: 'album-mini', nameVi: 'Album Mini', descriptionVi: 'Ba ảnh ghép như trang album, chữ in hoa thưa và ngày cưới.', style: 'hien-dai' },
  { id: 'han-quoc', nameVi: 'Hàn Quốc', descriptionVi: 'Ảnh hanbok và cung điện ghép ba khung, xanh khói nhẹ nhàng.', style: 'hien-dai' },
  { id: 'phim-den-trang', nameVi: 'Phim Đen Trắng', descriptionVi: 'Ba khung ảnh đen trắng như cuộn phim, tối giản và nghệ thuật.', style: 'toi-gian' },
  { id: 'xanh-hien-dai', nameVi: 'Xanh Hiện Đại', descriptionVi: 'Đĩa màu lớn sau ảnh tròn, chữ dàn trái, phong cách kiến trúc.', style: 'hien-dai' },
  { id: 'mat-troi', nameVi: 'Mặt Trời', descriptionVi: 'Mặt trời đất nung sau ảnh tròn, ấm áp và hiện đại.', style: 'hien-dai' },
  { id: 'vong-tron-hong', nameVi: 'Vòng Tròn Hồng', descriptionVi: 'Hình tròn hồng kẹo, chữ tròn trịa, vé mời dễ thương.', style: 'de-thuong' },
  { id: 've-may-bay', nameVi: 'Vé Máy Bay', descriptionVi: 'Thiệp như vé máy bay: chú rể đến cô dâu, cổng Hạnh phúc, ghế 01A.', style: 'hien-dai' },
  { id: 've-ra-dao', nameVi: 'Vé Ra Đảo', descriptionVi: 'Vé ra đảo cho đám cưới biển, xanh ngọc và san hô.', style: 'thien-nhien' },
  { id: 'rap-chieu', nameVi: 'Rạp Chiếu Bóng', descriptionVi: 'Poster phim: khởi chiếu ngày cưới, đạo diễn là định mệnh.', style: 'hien-dai' },
  { id: 'bom-tan', nameVi: 'Bom Tấn', descriptionVi: 'Poster điện ảnh xanh đêm, ảnh dưới dây đèn và lời đề tựa.', style: 'hien-dai' },
  { id: 'phim-han', nameVi: 'Phim Hàn', descriptionVi: 'Poster phim tím mận, lối đi đèn nến như cảnh phim Hàn.', style: 'sang-trong' },
  { id: 'bao-hy', nameVi: 'Báo Hỷ', descriptionVi: 'Trang nhất báo hỷ: tít lớn, ảnh đen trắng, bài viết hai cột.', style: 'hien-dai' },
  { id: 'nhat-bao', nameVi: 'Nhật Báo Tình Yêu', descriptionVi: 'Tờ báo cổ điển đưa tin hai bạn về chung một nhà.', style: 'co-dien' },
  { id: 'trang-ram', nameVi: 'Trăng Rằm', descriptionVi: 'Ảnh tròn như trăng rằm trên nền xanh đêm, viền vàng kim.', style: 'sang-trong' },
  { id: 'ngoc-luc-bao', nameVi: 'Ngọc Lục Bảo', descriptionVi: 'Xanh lục bảo và vàng kim, ảnh tròn dưới dây đèn.', style: 'sang-trong' },
  { id: 'dem-ha', nameVi: 'Đêm Hạ', descriptionVi: 'Ảnh đen trắng trong khung vàng trên nền xanh đêm.', style: 'sang-trong' },
  { id: 'nhung-den', nameVi: 'Nhung Đen', descriptionVi: 'Nhung đen, khung vàng, ảnh ánh nến ấm. Như dạ tiệc.', style: 'sang-trong' },
  { id: 'pha-le', nameVi: 'Pha Lê', descriptionVi: 'Điệu nhảy dưới đèn pha lê, khung vàng trên nền tím mận.', style: 'sang-trong' },
  { id: 'sai-gon-dem', nameVi: 'Sài Gòn Đêm', descriptionVi: 'Ảnh cầu hôn giữa đêm thành phố, chữ viết tay lớn trên nền trời.', style: 'hien-dai' },
  { id: 'ngoc-trai', nameVi: 'Ngọc Trai', descriptionVi: 'Khung oval viền ren, tông ngọc trai hồng, như thiệp cưới xưa.', style: 'co-dien' },
  { id: 'phong-thu-navy', nameVi: 'Phong Thư Hoàng Gia', descriptionVi: 'Phong bì xanh hoàng gia, dấu sáp vàng và ảnh áo dài.', style: 'sang-trong' },
  { id: 'champagne', nameVi: 'Champagne', descriptionVi: 'Ảnh dưới đèn chùm trong khung in, nền đen và vàng champagne.', style: 'sang-trong' },
  { id: 'vom-vang', nameVi: 'Vòm Vàng', descriptionVi: 'Ba vòm cửa trên nền đen, đèn chùm, nhẫn vàng và ánh nến.', style: 'sang-trong' },
  { id: 'thu-xua', nameVi: 'Thư Tình Xưa', descriptionVi: 'Ảnh nâu sepia trong khung oval, gió bay tà voan như phim cũ.', style: 'co-dien' },
  { id: 'hoai-niem', nameVi: 'Hoài Niệm', descriptionVi: 'Tông nâu đất, ảnh sepia và chữ in cổ, gợi kỷ niệm.', style: 'co-dien' },
  { id: 'phim-xua', nameVi: 'Phim Xưa', descriptionVi: 'Poster phim cổ điển, ảnh sepia và danh đề đạo diễn, sản xuất.', style: 'co-dien' },
  { id: 'tem-buu-dien', nameVi: 'Tem Bưu Điện', descriptionVi: 'Con tem vàng phố cổ, dấu bưu điện và viền thư như bưu thiếp xưa.', style: 'co-dien' },
  { id: 'dong-hoa', nameVi: 'Đồng Hoa Cúc', descriptionVi: 'Cô dâu giữa đồng cúc trắng, ảnh tràn màn hình và chữ viết tay.', style: 'thien-nhien' },
  { id: 'mua-thu', nameVi: 'Mùa Thu Vàng', descriptionVi: 'Lá vàng mùa thu, tà voan bay, chữ viết tay trắng.', style: 'thien-nhien' },
  { id: 'cong-torii', nameVi: 'Cổng Torii', descriptionVi: 'Cổng torii đỏ giữa trời xanh, cảm hứng đám cưới Nhật.', style: 'thien-nhien' },
  { id: 'thao-nguyen', nameVi: 'Thảo Nguyên', descriptionVi: 'Nắng vàng trên thảo nguyên, tà voan và nụ hôn.', style: 'thien-nhien' },
  { id: 'hoang-hon', nameVi: 'Hoàng Hôn', descriptionVi: 'Ôm nhau bên biển lúc hoàng hôn, chữ viết tay lớn trên bầu trời.', style: 'thien-nhien' },
  { id: 'bau-troi', nameVi: 'Bầu Trời', descriptionVi: 'Hai bóng người dưới bầu trời mây, rộng và tự do.', style: 'thien-nhien' },
  { id: 'so-bien', nameVi: 'Ngày Biển Xanh', descriptionVi: 'Con số ngày cưới chứa cả biển xanh bên trong.', style: 'thien-nhien' },
  { id: 'gio-bien', nameVi: 'Gió Biển', descriptionVi: 'Ảnh in viền trắng bãi biển, huy hiệu ngày cưới xanh biển.', style: 'thien-nhien' },
  { id: 'lich-xanh', nameVi: 'Lịch Xanh', descriptionVi: 'Trang lịch xanh lá, ảnh cô dâu giữa đồng cỏ.', style: 'thien-nhien' },
  { id: 'phong-thu-xanh', nameVi: 'Phong Thư Xanh', descriptionVi: 'Phong bì xanh lá, ảnh đồi sương cài bên trong, dấu sáp vàng.', style: 'thien-nhien' },
  { id: 'ky-niem', nameVi: 'Kỷ Niệm', descriptionVi: 'Ảnh polaroid ghim băng dính trên nền kem, như sổ kỷ niệm.', style: 'de-thuong' },
  { id: 'nang-ha', nameVi: 'Nắng Hạ', descriptionVi: 'Màu đào nắng hạ, polaroid và bóng bay, vui như ngày hè.', style: 'de-thuong' },
  { id: 'bac-ha', nameVi: 'Bạc Hà', descriptionVi: 'Xanh bạc hà mát lành, polaroid và chấm bi.', style: 'de-thuong' },
  { id: 've-hong', nameVi: 'Vé Hồng', descriptionVi: 'Vé máy bay hồng kẹo: chuyến bay một chiều đến hạnh phúc.', style: 'de-thuong' },
  { id: 'tem-hong', nameVi: 'Tem Hồng', descriptionVi: 'Con tem hồng, dấu bưu điện và viền thư sọc kẹo.', style: 'de-thuong' },
  { id: 'so-hong', nameVi: 'Số Hồng', descriptionVi: 'Ngày cưới thành con số lớn đầy hoa hồng bên trong.', style: 'de-thuong' },
  { id: 'lich-cuoi', nameVi: 'Lịch Ngày Cưới', descriptionVi: 'Trang lịch tối giản, ngày cưới khoanh tim, ảnh studio trắng.', style: 'toi-gian' },
  { id: 'i-love-you', nameVi: 'I Love You', descriptionVi: 'Nền đỏ rượu vang, ảnh khung vòm và chữ I Love You xếp dọc.', style: 'lang-man' },
  { id: 'cam-dat', nameVi: 'Cam Đất', descriptionVi: 'Cam đất ấm, ảnh dù đỏ trong khung vòm, chữ dọc hai bên.', style: 'hien-dai' },
  // 100 interactive 3D walkthrough templates (10 originals + 90 rich spatial/camera concepts)
  { id: '3d-oai-huong', nameVi: 'Oải Hương 3D', descriptionVi: 'Cánh đồng tím hoàng hôn · camera lướt dải lụa qua ba khu đón khách, kỷ niệm & lễ đài.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-mua-dong-tuyet', nameVi: 'Mùa Đông Tuyết 3D', descriptionVi: 'Sân tròn tuyết rơi · gazebo kính lung linh · xoay vòng tròn triển lãm.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-mua-thu', nameVi: 'Mùa Thu Lá Phong 3D', descriptionVi: 'Triển lãm ảnh cưới dưới vòm lá phong đỏ rực · dạo bước ziczac nghệ thuật.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-ho-sen-hoa-dang', nameVi: 'Hồ Sen Hoa Đăng 3D', descriptionVi: 'Cầu cửu khúc · hoa đăng trôi nước · thủy tạ trăng thanh truyền thống Việt.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-rung-thong', nameVi: 'Rừng Thông 3D', descriptionVi: 'Đường mòn gỗ uốn lượn · sương sớm rừng thông Đà Lạt · bay cánh hạc.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-dem-trang', nameVi: 'Đêm Trăng Sao 3D', descriptionVi: 'Vầng trăng tròn cổ tích · đèn trời lơ lửng · pháo hoa chúc mừng rực rỡ.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-tren-may', nameVi: 'Trên Mây Hồng 3D', descriptionVi: 'Biển mây hồng bồng bềnh · đảo hoa lơ lửng · nấc thang mây thần tiên.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-vuon-hoa-dao', nameVi: 'Vườn Hoa Đào 3D', descriptionVi: 'Vườn xuân hoa đào · đèn lồng đỏ · thảm đỏ & tráp hỷ rước dâu.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-co-truyen', nameVi: 'Cổ Truyền Rồng Phụng 3D', descriptionVi: 'Cổng rồng phụng kết hoa · áo dài · hoành phi Song Hỷ sơn mài vàng kim.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-rap-cuoi', nameVi: 'Rạp Cưới Voan Hồng 3D', descriptionVi: 'Rạp voan hồng lụa mềm · dãy bàn tiệc · áo dài chào khách trang nhã.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Lướt dải lụa' },

  // Cổ Đô & Gia Tiên Việt (+11)
  { id: '3d-hoang-thanh-hue', nameVi: 'Hoàng Thành Đại Nội 3D', descriptionVi: 'Ngọ Môn son thếp vàng · khung tranh sơn mài cung đình · góc máy rước lễ uy nghi.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-pho-hoi-den-long', nameVi: 'Phố Hội Đèn Lồng 3D', descriptionVi: 'Phố cổ tường vàng giăng trăm đèn lồng lụa · tranh cuộn lụa trúc đung đưa.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-dinh-lang-cay-da', nameVi: 'Đình Làng Cây Đa 3D', descriptionVi: 'Sân gạch đỏ cổng tam quan cổ kính · tráp ăn hỏi truyền thống Bắc Bộ.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-trang-an-thuy-dinh', nameVi: 'Tràng An Thủy Đình 3D', descriptionVi: 'Non nước Ninh Bình hùng vĩ · cầu đá qua đầm sen dẫn vào thủy đình cổ.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-nhat-binh-cung-dinh', nameVi: 'Nhật Bình Cung Đình 3D', descriptionVi: 'Không gian lầu son gác tía · cổ phục Nhật Bình & liễn lụa thêu phượng hoàng.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-hang-thuan-chua-vang', nameVi: 'Lễ Hằng Thuận Chùa Vàng 3D', descriptionVi: 'Không gian thiền môn thanh tịnh · chuông gió hoa sen & bậc thềm đá an yên.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-rap-la-dua-mien-tay', nameVi: 'Rạp Lá Dừa Miền Tây 3D', descriptionVi: 'Cổng lá dừa kết hoa đủng đỉnh · cầu ván gỗ miệt vườn sông nước hào sảng.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-cau-trau-que-huong', nameVi: 'Cổng Cau Trầu Quê Hương 3D', descriptionVi: 'Buồng cau xanh dây trầu thắm · khung tre trúc mộc mạc đậm tình nghĩa tào khang.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-thang-long-hoang-kim', nameVi: 'Thăng Long Hoàng Kim 3D', descriptionVi: 'Hoàng thành rực sắc vàng son · sân tròn trống đồng & pháo hoa đại lễ.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-lua-ha-dong-son-do', nameVi: 'Lụa Hà Đông Son Đỏ 3D', descriptionVi: 'Dải lụa tơ tằm uốn lượn trên không · khung tranh sơn mài khảm trai tinh xảo.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-ben-nuoc-con-do', nameVi: 'Bến Nước Con Đò 3D', descriptionVi: 'Hoàng hôn tím bên bến sông quê · rặng tre ngà & hoa đăng lững lờ trôi.', style: 'thiep-3d', category3d: 'co-do-truyen-thong', cameraTagVi: 'Thuyền trôi' },

  // Vườn Hoa & Bốn Mùa (+8)
  { id: '3d-doi-huong-duong', nameVi: 'Đồi Hoa Hướng Dương 3D', descriptionVi: 'Đồi nắng vàng rực rỡ hướng về mặt trời · bậc gỗ cao dần lên lễ đài lộng gió.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-vuon-hong-co-phap', nameVi: 'Vườn Hồng Cổ Pháp 3D', descriptionVi: 'Vòm hồng leo ngát hương · sân tròn đài phun nước & khung Rococo ngọc trai.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-hoa-ban-tay-bac', nameVi: 'Mùa Hoa Ban Tây Bắc 3D', descriptionVi: 'Sắc trắng tím hoa ban giữa mây núi đại ngàn · bậc đá sương mù thơ mộng.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-thung-lung-cam-tu-cau', nameVi: 'Thung Lũng Cẩm Tú Cầu 3D', descriptionVi: 'Biển hoa cẩm tú cầu xanh biếc Đà Lạt · khung ảnh vòng nguyệt quế lá tươi.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-anh-dao-kyoto', nameVi: 'Vườn Anh Đào Kyoto 3D', descriptionVi: 'Mưa cánh hoa sakura hồng phấn · cổng gỗ mộc & cuộn tranh lụa tinh khôi.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-canh-dong-cuc-hoa-mi', nameVi: 'Cánh Đồng Cúc Họa Mi 3D', descriptionVi: 'Thu Hà Nội dịu dàng trong sắc cúc trắng · lối đá sân vườn & nắng mật ong.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-vuon-cam-dia-trung-hai', nameVi: 'Vườn Cam Địa Trung Hải 3D', descriptionVi: 'Hàng cây trĩu quả vàng nắng · vòm gốm sứ xanh trắng & tiệc vườn phóng khoáng.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-mua-hoa-phuong-do', nameVi: 'Mùa Hoa Phượng Đỏ 3D', descriptionVi: 'Bầu trời rực đỏ kỷ niệm tuổi học trò · lối đi ngập cánh phượng mùa hạ.', style: 'thiep-3d', category3d: 'vuon-hoa-mua-xuan', cameraTagVi: 'Ống kính điện ảnh' },

  // Biển Đảo & Hoàng Hôn (+11)
  { id: '3d-bai-bien-hoang-hon', nameVi: 'Bãi Biển Hoàng Hôn 3D', descriptionVi: 'Mặt trời đỏ cam lặn xuống đại dương · cổng tre voan trắng & đuốc biển lãng mạn.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-phu-quoc-ngoc-trai', nameVi: 'Phú Quốc Ngọc Trai 3D', descriptionVi: 'Biển ngọc bích đảo ngọc · khung ảnh vỏ trai trắng & thảm lụa cát mịn.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-ha-long-du-thuyen', nameVi: 'Vịnh Hạ Long Du Thuyền 3D', descriptionVi: 'Boong tàu gỗ sang trọng lướt giữa ngàn đảo đá vôi kỳ vĩ lúc chiều tà.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-santorini-vom-xanh', nameVi: 'Santorini Vòm Xanh 3D', descriptionVi: 'Bậc thang tường vôi trắng & mái vòm xanh coban nhìn thẳng ra biển Aegean.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-dao-san-ho-nang-vang', nameVi: 'Đảo San Hô Nắng Vàng 3D', descriptionVi: 'Bầu trời xanh ngắt nhiệt đới · rặng dừa nghiêng bóng & vòng hoa nhiệt đới.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-mui-ne-doi-cat-hong', nameVi: 'Mũi Né Đồi Cát Hồng 3D', descriptionVi: 'Đường cong đồi cát hồng cam rực nắng · thảm boho dệt tay & cỏ lau trắng.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-maldives-cau-go', nameVi: 'Maldives Cầu Gỗ Biển Xanh 3D', descriptionVi: 'Cầu gỗ nổi uốn lượn trên làn nước pha lê · thủy tạ cưới giữa đại dương.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-vach-da-bien-khoi', nameVi: 'Vách Đá Biển Khơi 3D', descriptionVi: 'Lễ đài cheo leo trên ghềnh đá đón sóng tung bọt trắng · camera bay hùng vĩ.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-rung-dua-ben-tre', nameVi: 'Rừng Dừa Bến Tre 3D', descriptionVi: 'Nắng xuyên tàu dừa xanh mát · lối gỗ ven sông bình dị và ấm cúng.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-con-dao-sao-dem', nameVi: 'Côn Đảo Sao Đêm 3D', descriptionVi: 'Bãi biển đêm đầy sao lấp lánh · khung pha lê phát sáng & đèn bão cổ điển.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-ben-du-thuyen-champagne', nameVi: 'Bến Du Thuyền Champagne 3D', descriptionVi: 'Tiệc chiều thượng lưu bên bến cảng · ánh vàng kim & tiếng nhạc du dương.', style: 'thiep-3d', category3d: 'bien-dao-nhiet-doi', cameraTagVi: 'Xoay vanxơ' },

  // Rừng Núi & Sương Sớm (+10)
  { id: '3d-sapa-may-nui', nameVi: 'Sapa Mây Núi 3D', descriptionVi: 'Săn mây trên đỉnh núi Tây Bắc · bậc thang đá dẫn lên cổng trời bảng lảng sương.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-dalat-nha-kinh-hoa', nameVi: 'Đà Lạt Nhà Kính Hoa 3D', descriptionVi: 'Vòm kính sắt nghệ thuật ngập tràn hoa tươi & nắng mai xuyên qua làn sương.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-thac-ban-gioc', nameVi: 'Thác Bản Giốc Ngọc Bích 3D', descriptionVi: 'Dòng nước ngọc bích giữa núi non trùng điệp · cầu gỗ & hơi sương mát lành.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-doi-che-tan-cuong', nameVi: 'Đồi Chè Tân Cương 3D', descriptionVi: 'Những luống chè xanh mướt trải dài tới chân trời · bình minh trong trẻo.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-thao-nguyen-xanh', nameVi: 'Thảo Nguyên Gió Xanh 3D', descriptionVi: 'Đồng cỏ mênh mông dưới bầu trời mây trắng · tự do phóng khoáng.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-rung-dom-dom', nameVi: 'Rừng Đom Đóm Đêm Hạ 3D', descriptionVi: 'Ngàn ánh đom đóm vàng xanh bay lên giữa rừng đêm cổ tích huyền diệu.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-thung-lung-ruou-vang', nameVi: 'Thung Lũng Rượu Vang 3D', descriptionVi: 'Hàng nho chín tím dưới nắng chiều Tuscany · vòm gạch cổ & thùng gỗ sồi.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-ho-tuyen-lam', nameVi: 'Hồ Tuyền Lâm Sương Khói 3D', descriptionVi: 'Mặt hồ phẳng lặng soi bóng thông già lúc hửng đông · thuyền trôi êm đềm.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-nui-tuyet-thuy-si', nameVi: 'Núi Tuyết Thụy Sĩ 3D', descriptionVi: 'Đỉnh Alps phủ tuyết trắng dưới nắng hồng · lễ đài gỗ ấm áp giữa trời đông.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-nha-go-bac-au', nameVi: 'Nhà Gỗ Bắc Âu 3D', descriptionVi: 'Dây đèn vàng ấm giăng giữa rừng thông tuyết · phong cách Nordic Hygge.', style: 'thiep-3d', category3d: 'rung-nui-suong-mai', cameraTagVi: 'Dạo triển lãm' },

  // Hồ Nước & Hoa Đăng (+9)
  { id: '3d-song-hoai-tha-den', nameVi: 'Sông Hoài Thả Đèn 3D', descriptionVi: 'Dòng sông đêm rực sáng ngàn hoa đăng giấy · nhịp cầu gỗ nối đôi bờ thương nhớ.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-ho-guom-the-huc', nameVi: 'Hồ Gươm Cầu Thê Húc 3D', descriptionVi: 'Nhịp cầu son đỏ uốn cong trên mặt hồ lục thủy · liễu rủ mùa thu Hà Nội.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-venice-gondola', nameVi: 'Venice Gondola Tình Yêu 3D', descriptionVi: 'Kênh đào lãng mạn nước Ý · cầu đá vòm cổ kính & đèn đường phảng phất.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-suoi-nguon-rung-truc', nameVi: 'Suối Nguồn Rừng Trúc 3D', descriptionVi: 'Dòng suối trong vắt chảy qua rừng trúc xanh · cuộn tranh treo thanh tao.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-ho-thien-nga', nameVi: 'Hồ Thiên Nga Ánh Trăng 3D', descriptionVi: 'Mặt hồ bạc dưới trăng rằm · đài vòm pha lê & điệu vanxơ xoay vòng.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-dam-sen-trang', nameVi: 'Đầm Sen Trắng Sương Mai 3D', descriptionVi: 'Sen bạch liên tinh khiết nở trong sương sớm · cầu ván mộc thanh khiết.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-thuy-ta-cung-trang', nameVi: 'Thủy Tạ Cung Trăng 3D', descriptionVi: 'Lầu bát giác nổi giữa hồ sao đêm · đèn lồng cung đình soi bóng nước.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-ben-thuyen-hoa-tim', nameVi: 'Bến Thuyền Hoa Tím 3D', descriptionVi: 'Cầu gỗ phủ hoa tử đằng tím rủ xuống mặt hồ hoàng hôn thơ mộng.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-vuon-nuoc-zen', nameVi: 'Vườn Nước Nhật Bản 3D', descriptionVi: 'Cầu đỏ bắc qua hồ cá Koi & đá cuội rêu phong · tối giản đầy chất thiền.', style: 'thiep-3d', category3d: 'ho-nuoc-thuy-ta', cameraTagVi: 'Dạo triển lãm' },

  // Cổ Tích, Mây & Ngân Hà (+10)
  { id: '3d-cuc-quang-bac-cuc', nameVi: 'Cực Quang Bắc Cực 3D', descriptionVi: 'Dải cực quang xanh ngọc uốn lượn trên bầu trời sao · khung pha lê lơ lửng.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-lau-dai-pha-le', nameVi: 'Lâu Đài Pha Lê 3D', descriptionVi: 'Tháp pha lê lấp lánh giữa tầng không · thảm gương sao & ánh kim ngân hà.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-ngan-ha-tinh-tu', nameVi: 'Ngân Hà Tinh Tú 3D', descriptionVi: 'Bước đi trên dải ngân hà lấp lánh · các hành tinh & khung ảnh bay không trọng lực.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-nac-thang-thien-duong', nameVi: 'Nấc Thang Lên Thiên Đường 3D', descriptionVi: 'Bậc thang cẩm thạch trắng vươn cao qua biển mây vàng dẫn tới vòm trăng.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-khu-vuon-anh-trang', nameVi: 'Khu Vườn Ánh Trăng 3D', descriptionVi: 'Cổng trăng khuyết khổng lồ tỏa sáng giữa vườn hoa đêm phát quang huyền ảo.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-co-xe-co-tich', nameVi: 'Cỗ Xe Bí Ngô Cổ Tích 3D', descriptionVi: 'Vườn lâu đài phép thuật nửa đêm · bụi tiên vàng kim & khung Rococo.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-dao-noi-than-tien', nameVi: 'Đảo Nổi Thần Tiên 3D', descriptionVi: 'Mỗi bức ảnh kỷ niệm đặt trên một hòn đảo mây lơ lửng nối bằng cầu ánh sáng.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-cung-dien-anh-sang', nameVi: 'Cung Điện Ánh Sáng 3D', descriptionVi: 'Hàng cột ánh sáng vươn lên trời sao · giao hưởng vàng trắng trang nghiêm.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-mua-sao-bang', nameVi: 'Mưa Sao Băng Ước Nguyện 3D', descriptionVi: 'Bầu trời đêm tím thẫm rực sáng mưa sao băng · hẹn ước vĩnh cửu.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-vuong-quoc-bang-gia', nameVi: 'Vương Quốc Băng Giá 3D', descriptionVi: 'Cung điện băng lam ngọc phản chiếu cực quang · bông tuyết kim cương rơi.', style: 'thiep-3d', category3d: 'co-tich-ngan-ha', cameraTagVi: 'Nấc thang mây' },

  // Lâu Đài & Dạ Tiệc Thượng Lưu (+10)
  { id: '3d-dai-sanh-pha-le', nameVi: 'Đại Sảnh Đèn Chùm Pha Lê 3D', descriptionVi: 'Sàn đá cẩm thạch trắng viền vàng · dãy đèn chùm pha lê rực rỡ hoàng gia.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-thanh-duong-gothic', nameVi: 'Thánh Đường Gothic 3D', descriptionVi: 'Vòm đá cao vút & khung cửa kính màu nhà thờ · khúc nhạc Canon thiêng liêng.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-cung-dien-versailles', nameVi: 'Cung Điện Versailles 3D', descriptionVi: 'Khu vườn đối xứng Pháp · đài phun nước tròn & khung vòm mạ vàng cổ điển.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-vuon-tuong-la-ma', nameVi: 'Vườn Tượng La Mã 3D', descriptionVi: 'Hàng cột đá trắng thức cột Corinth dưới hoàng hôn vàng ấm vùng Địa Trung Hải.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-da-tiec-gatsby', nameVi: 'Dạ Tiệc Gatsby Hoàng Kim 3D', descriptionVi: 'Đen tuyền & vàng kim Art Deco thập niên 20 · pháo hoa champagne lộng lẫy.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-biet-thu-ho-como', nameVi: 'Biệt Thự Hồ Como 3D', descriptionVi: 'Ban công đá cẩm thạch nhìn ra mặt hồ nước Ý xanh thẳm & tùng bách cổ thụ.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-sanh-nhung-hoang-gia', nameVi: 'Sảnh Nhung Đỏ Hoàng Gia 3D', descriptionVi: 'Rèm nhung đỏ rượu vang & nến ấm · dạ tiệc tối sang trọng bậc nhất.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-lau-dai-bavaria', nameVi: 'Lâu Đài Cổ Tích Bavaria 3D', descriptionVi: 'Lâu đài trắng trên đỉnh đồi sương mù châu Âu · bậc đá dẫn lối hoàng gia.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Nấc thang mây' },
  { id: '3d-nha-hat-opera', nameVi: 'Nhà Hát Opera Hoa Hồng 3D', descriptionVi: 'Khán phòng nhung đỏ mạ vàng · ánh đèn sân khấu tôn vinh nhân vật chính.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-san-trong-indochine', nameVi: 'Sân Trong Đông Dương Indochine 3D', descriptionVi: 'Gạch bông đen trắng, vòm cửa gỗ lá sách & cọ xanh phong cách Đông Dương.', style: 'thiep-3d', category3d: 'lau-dai-chau-au', cameraTagVi: 'Dạo triển lãm' },

  // Điện Ảnh, Ký Ức & Nghệ Thuật (+11)
  { id: '3d-rap-chieu-phim', nameVi: 'Rạp Chiếu Phim Tình Yêu 3D', descriptionVi: 'Bảng đèn bóng tròn Premiere · mỗi bức ảnh là một thước phim hộp đèn 35mm.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-chuyen-tau-thanh-xuan', nameVi: 'Chuyến Tàu Thanh Xuân 3D', descriptionVi: 'Đường ray ký ức đi qua những mùa thương · các trạm dừng lưu giữ tuổi trẻ.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-bao-tang-my-thuat', nameVi: 'Bảo Tàng Mỹ Thuật 3D', descriptionVi: 'Phòng trưng bày vòm trắng tinh tế · camera dạo bước ngắm từng tuyệt tác tình yêu.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-thu-vien-co-dien', nameVi: 'Thư Viện Cổ Điển 3D', descriptionVi: 'Không gian gỗ ấm & ánh đèn bàn xanh · viết tiếp chương đẹp nhất cuộc đời.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-phong-tra-jazz', nameVi: 'Phòng Trà Jazz Sài Gòn Xưa 3D', descriptionVi: 'Ánh đèn vàng hổ phách hoài cổ · khung hộp đèn ấm áp & giai điệu du dương.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-san-ga-mua-dong', nameVi: 'Sân Ga Mùa Đông 3D', descriptionVi: 'Đồng hồ sân ga cổ & làn tuyết bay nhẹ dưới ánh đèn đường vàng ấm.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-trien-lam-den-trang', nameVi: 'Triển Lãm Phim Đen Trắng 3D', descriptionVi: 'Không gian nghệ thuật Monochrome đối lập ánh kim · sang trọng vượt thời gian.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-tiem-dia-than', nameVi: 'Tiệm Đĩa Than Hoài Niệm 3D', descriptionVi: 'Tông nâu trầm ấm Retro thập niên 90 · lưu giữ bản tình ca của riêng hai đứa.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-buu-dien-sai-gon', nameVi: 'Bưu Điện Sài Gòn Hoa Lệ 3D', descriptionVi: 'Vòm sắt xanh cổ điển & tường vàng di sản · những bức thư tay gửi trọn trăm năm.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Rước lễ cung đình' },
  { id: '3d-san-khau-broadway', nameVi: 'Sân Khấu Broadway 3D', descriptionVi: 'Vòm đèn rực sáng đêm công chiếu · hai bạn là ngôi sao duy nhất trên lễ đài.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-xuong-ve-mau-nuoc', nameVi: 'Xưởng Vẽ Màu Nước 3D', descriptionVi: 'Bầu trời loang màu pastel thơ mộng · giá vẽ gỗ mộc điểm hoa lá tự nhiên.', style: 'thiep-3d', category3d: 'dien-anh-nghe-thuat', cameraTagVi: 'Xoay vanxơ' },

  // Hiện Đại, Rooftop & Đô Thị (+10)
  { id: '3d-rooftop-sai-gon', nameVi: 'Rooftop Sài Gòn Đêm 3D', descriptionVi: 'Tầng thượng lộng gió ngắm bokeh thành phố về đêm · khung kính phát sáng hiện đại.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-cau-anh-sao', nameVi: 'Cầu Ánh Sao Pháo Hoa 3D', descriptionVi: 'Lối đi kính rực sáng ngàn điểm sao & pháo hoa rực rỡ phản chiếu mặt hồ đêm.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-trien-lam-kinh', nameVi: 'Triển Lãm Kính Đương Đại 3D', descriptionVi: 'Kiến trúc vòm kính trong suốt giữa thiên nhiên · khung ảnh lơ lửng tinh giản.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-penthouse-vo-cuc', nameVi: 'Penthouse Hồ Bơi Vô Cực 3D', descriptionVi: 'Lối đi nổi trên mặt nước hồ bơi vô cực nhìn ra đường chân trời hoàng hôn.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Thuyền trôi' },
  { id: '3d-pho-di-bo-neon', nameVi: 'Phố Đi Bộ Đèn Neon 3D', descriptionVi: 'Sắc tím hồng trẻ trung hiện đại · vòng hào quang ánh sáng năng động cá tính.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Ống kính điện ảnh' },
  { id: '3d-vuon-toi-gian-zen', nameVi: 'Khu Vườn Tối Giản Zen 3D', descriptionVi: 'Tường trắng kem, đá cuội & nhánh ô liu · vẻ đẹp tĩnh tại kiểu kiến trúc đương đại.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Dạo triển lãm' },
  { id: '3d-studio-anh-sang', nameVi: 'Studio Ánh Sáng Trắng 3D', descriptionVi: 'Không gian toàn trắng thuần khiết tôn trọn từng khung hình cưới chuẩn Hàn Quốc.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Lướt dải lụa' },
  { id: '3d-ca-phe-goc-pho', nameVi: 'Quán Cà Phê Góc Phố 3D', descriptionVi: 'Góc phố nắng chiều ấm áp & dây đèn vàng · nơi bắt đầu những buổi hẹn đầu tiên.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Xoay vanxơ' },
  { id: '3d-cau-rong-song-han', nameVi: 'Cầu Rồng Sông Hàn 3D', descriptionVi: 'Đêm hội pháo hoa rực sáng đôi bờ sông Hàn Đà Nẵng · trẻ trung & rộn ràng.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Bay cánh hạc' },
  { id: '3d-khong-gian-kien-truc', nameVi: 'Không Gian Kiến Trúc Đương Đại 3D', descriptionVi: 'Vòm bê tông kem ấm kết hợp hoa cỏ lau & ánh nắng xiên nghệ thuật.', style: 'thiep-3d', category3d: 'hien-dai-thanh-thi', cameraTagVi: 'Nấc thang mây' },
];

export const INVITATION_2D_TEMPLATES: InvitationTemplateMeta[] = INVITATION_TEMPLATES.filter((t) => !isWalkthrough3DTemplate(t.id));

export const INVITATION_3D_TEMPLATES: InvitationTemplateMeta[] = INVITATION_TEMPLATES.filter((t) => isWalkthrough3DTemplate(t.id));

export const DEFAULT_INVITATION_TEMPLATE: InvitationTemplateId = 'song-hy-do';

const TEMPLATE_ID_SET = new Set<string>(INVITATION_TEMPLATE_IDS);

export function isInvitationTemplateId(id: unknown): id is InvitationTemplateId {
  return typeof id === 'string' && TEMPLATE_ID_SET.has(id);
}

export type InvitationEventKind = 'AN_HOI' | 'VU_QUY' | 'THANH_HON' | 'TIEC_NHA_GAI' | 'TIEC_NHA_TRAI' | 'TIEC_CUOI' | 'KHAC';

export const INVITATION_EVENT_LABELS: Record<InvitationEventKind, string> = {
  AN_HOI: 'Lễ Ăn Hỏi',
  VU_QUY: 'Lễ Vu Quy',
  THANH_HON: 'Lễ Thành Hôn',
  TIEC_NHA_GAI: 'Tiệc Cưới Nhà Gái',
  TIEC_NHA_TRAI: 'Tiệc Cưới Nhà Trai',
  TIEC_CUOI: 'Tiệc Cưới',
  KHAC: 'Sự kiện khác',
};

export interface InvitationEvent {
  id: string;
  kind: InvitationEventKind;
  title: string;
  /** ISO instant */
  startsAt: string;
  venueName: string;
  address: string;
  /** Google Maps (or other https) link; built from the address when empty */
  mapUrl: string;
  note: string;
}

export interface InvitationStoryItem {
  id: string;
  /** Free text: "Mùa thu 2019", "14/02/2022" */
  when: string;
  title: string;
  text: string;
}

/** Per-photo memory card shown when a guest taps a 3D photo easel ("Kỷ niệm 1/6") */
export interface InvitationMemoryItem {
  /** Matches PhotoAsset.publicUrl (empty falls back to slot order) */
  photoUrl: string;
  /** Year or short milestone: "2023", "10.2024" */
  year: string;
  /** Bold serif headline: "Phố Hội lên đèn" */
  title: string;
  /** Warm story paragraph shown in the slide-up glass card */
  story: string;
}

export interface InvitationFamily {
  father: string;
  mother: string;
  address: string;
}

export type InvitationSectionKey = 'countdown' | 'family' | 'events' | 'story' | 'album' | 'rsvp' | 'wishes' | 'gift' | 'hall';

/**
 * Built-in wedding music, played by a small synthesiser in the guest's browser (no audio file):
 * public-domain classics in our own arrangement, and originals written for the site.
 */
export const INVITATION_MUSIC_TRACKS = [
  { id: 'hop-nhac', nameVi: 'Hộp nhạc ngọt ngào', noteVi: 'Điệu valse hộp nhạc, sáng tác riêng' },
  { id: 'canon', nameVi: 'Canon in D', noteVi: 'Pachelbel, bản phối piano và đàn dây' },
  { id: 'bridal', nameVi: 'Here Comes the Bride', noteVi: 'Wagner, khúc rước dâu kinh điển' },
  { id: 'ode', nameVi: 'Ode to Joy', noteVi: 'Beethoven, Khúc hoan ca' },
  { id: 'piano', nameVi: 'Piano lãng mạn', noteVi: 'Piano nhẹ nhàng, sáng tác riêng' },
  { id: 'sao-truc', nameVi: 'Sáo trúc đồng quê', noteVi: 'Giai điệu ngũ cung, sáng tác riêng' },
  { id: 'dan-tranh', nameVi: 'Đàn tranh ngày vui', noteVi: 'Tiếng đàn tranh ngũ cung, sáng tác riêng' },
] as const;

export type InvitationMusicTrackId = (typeof INVITATION_MUSIC_TRACKS)[number]['id'];

export function isInvitationMusicTrackId(v: unknown): v is InvitationMusicTrackId {
  return typeof v === 'string' && INVITATION_MUSIC_TRACKS.some((t) => t.id === v);
}

export interface InvitationConfig {
  templateId: InvitationTemplateId;
  /** Names as printed on the card (default: the wedding's names) */
  groomFullName: string;
  brideFullName: string;
  headline: string;
  message: string;
  quote: string;
  groomFamily: InvitationFamily;
  brideFamily: InvitationFamily;
  events: InvitationEvent[];
  story: InvitationStoryItem[];
  /** Optional per-photo memory titles & stories shown when tapping 3D photo easels */
  memories: InvitationMemoryItem[];
  /** https or site-relative image; empty = first album photo */
  coverPhotoUrl: string;
  /** Optional custom transparent/full-body standee image for 3D walkthrough invitations */
  coupleCutoutUrl: string;
  /** Optional greeting shown in the 3D couple speech bubble ({khach} is replaced by guest name) */
  walkthroughGreeting: string;
  /** SYNTH = a built-in piece played in the browser (track), URL = the couple's own audio link */
  music: { mode: 'SYNTH' | 'URL' | 'OFF'; url: string; track: InvitationMusicTrackId };
  sections: Record<InvitationSectionKey, boolean>;
  rsvpDeadline: string;
  dressCode: string;
  thankYou: string;
}

export const INVITATION_LIMITS = {
  name: 80,
  headline: 120,
  message: 600,
  quote: 240,
  greeting: 140,
  familyField: 120,
  events: 6,
  eventTitle: 80,
  venueName: 140,
  address: 240,
  url: 500,
  note: 200,
  story: 8,
  storyWhen: 40,
  storyTitle: 80,
  storyText: 500,
  memories: 8,
  memoryYear: 24,
  memoryTitle: 80,
  memoryStory: 320,
  dressCode: 120,
  thankYou: 400,
} as const;

let idCounter = 0;
export function invitationItemId(prefix: string): string {
  idCounter = (idCounter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

/** Same day, at a given Vietnam local hour, as an ISO instant */
function atVietnamHour(iso: string, hour: number, minute = 0): string {
  const t = Date.parse(iso);
  const base = Number.isFinite(t) ? new Date(t + 7 * 3600 * 1000) : new Date(Date.now() + 7 * 3600 * 1000);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour - 7, minute)).toISOString();
}

export function defaultInvitationConfig(w: { groomName: string; brideName: string; weddingDate: string }): InvitationConfig {
  return {
    templateId: DEFAULT_INVITATION_TEMPLATE,
    groomFullName: w.groomName,
    brideFullName: w.brideName,
    headline: 'Trân trọng báo tin Lễ Thành Hôn',
    message:
      'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi. Rất mong được đón tiếp và cùng chung vui trong ngày trọng đại của hai con.',
    quote: 'Yêu nhau cởi áo cho nhau, về nhà dối mẹ qua cầu gió bay.',
    groomFamily: { father: '', mother: '', address: '' },
    brideFamily: { father: '', mother: '', address: '' },
    events: [
      { id: 'ev_thanh_hon', kind: 'THANH_HON', title: INVITATION_EVENT_LABELS.THANH_HON, startsAt: atVietnamHour(w.weddingDate, 9), venueName: 'Tư gia nhà trai', address: '', mapUrl: '', note: '' },
      { id: 'ev_tiec', kind: 'TIEC_CUOI', title: INVITATION_EVENT_LABELS.TIEC_CUOI, startsAt: atVietnamHour(w.weddingDate, 18), venueName: '', address: '', mapUrl: '', note: 'Đón khách từ 17:30' },
    ],
    story: [],
    memories: [],
    coverPhotoUrl: '',
    coupleCutoutUrl: '',
    walkthroughGreeting: '',
    music: { mode: 'SYNTH', url: '', track: 'hop-nhac' },
    sections: { countdown: true, family: true, events: true, story: true, album: true, rsvp: true, wishes: true, gift: true, hall: true },
    rsvpDeadline: '',
    dressCode: '',
    thankYou: 'Cảm ơn bạn đã dành thời gian đọc thiệp. Hẹn gặp bạn trong ngày vui của chúng mình!',
  };
}

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  // Strip control characters; keep Vietnamese text and line breaks intact
  return v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
}

/** https URL or site-relative path; anything else (javascript:, data:, http:) becomes '' */
export function safeInvitationUrl(v: unknown): string {
  const s = str(v, INVITATION_LIMITS.url);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

function iso(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : fallback;
}

function family(v: unknown): InvitationFamily {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    father: str(o.father, INVITATION_LIMITS.familyField),
    mother: str(o.mother, INVITATION_LIMITS.familyField),
    address: str(o.address, INVITATION_LIMITS.familyField),
  };
}

const EVENT_KINDS = Object.keys(INVITATION_EVENT_LABELS) as InvitationEventKind[];
const SECTION_KEYS: InvitationSectionKey[] = ['countdown', 'family', 'events', 'story', 'album', 'rsvp', 'wishes', 'gift', 'hall'];

/**
 * Accepts anything (stored JSON, a PATCH body) and returns a complete, bounded config.
 * Missing fields come from `base`.
 */
export function sanitizeInvitationConfig(input: unknown, base: InvitationConfig): InvitationConfig {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k);

  const events = Array.isArray(o.events)
    ? o.events.slice(0, INVITATION_LIMITS.events).map((raw, i) => {
        const e = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const kind = EVENT_KINDS.includes(e.kind as InvitationEventKind) ? (e.kind as InvitationEventKind) : 'KHAC';
        return {
          id: str(e.id, 40) || `ev_${i}`,
          kind,
          title: str(e.title, INVITATION_LIMITS.eventTitle) || INVITATION_EVENT_LABELS[kind],
          startsAt: iso(e.startsAt, base.events[0]?.startsAt ?? new Date().toISOString()),
          venueName: str(e.venueName, INVITATION_LIMITS.venueName),
          address: str(e.address, INVITATION_LIMITS.address),
          mapUrl: safeInvitationUrl(e.mapUrl),
          note: str(e.note, INVITATION_LIMITS.note),
        };
      })
    : base.events;

  const story = Array.isArray(o.story)
    ? o.story
        .slice(0, INVITATION_LIMITS.story)
        .map((raw, i) => {
          const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
          return {
            id: str(s.id, 40) || `st_${i}`,
            when: str(s.when, INVITATION_LIMITS.storyWhen),
            title: str(s.title, INVITATION_LIMITS.storyTitle),
            text: str(s.text, INVITATION_LIMITS.storyText),
          };
        })
        .filter((s) => s.title || s.text)
    : base.story;

  const memories = Array.isArray(o.memories)
    ? o.memories
        .slice(0, INVITATION_LIMITS.memories)
        .map((raw) => {
          const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
          return {
            photoUrl: safeInvitationUrl(m.photoUrl),
            year: str(m.year, INVITATION_LIMITS.memoryYear),
            title: str(m.title, INVITATION_LIMITS.memoryTitle),
            story: str(m.story, INVITATION_LIMITS.memoryStory),
          };
        })
        .filter((m) => m.photoUrl || m.title || m.story || m.year)
    : base.memories;

  const musicIn = (o.music && typeof o.music === 'object' ? o.music : {}) as Record<string, unknown>;
  const musicMode = musicIn.mode === 'URL' || musicIn.mode === 'OFF' || musicIn.mode === 'SYNTH' ? musicIn.mode : base.music.mode;
  const musicUrl = has('music') ? safeInvitationUrl(musicIn.url) : base.music.url;
  const musicTrack = isInvitationMusicTrackId(musicIn.track) ? musicIn.track : (base.music.track ?? 'hop-nhac');

  const sectionsIn = (o.sections && typeof o.sections === 'object' ? o.sections : {}) as Record<string, unknown>;
  const sections = Object.fromEntries(
    SECTION_KEYS.map((k) => [k, typeof sectionsIn[k] === 'boolean' ? (sectionsIn[k] as boolean) : base.sections[k]]),
  ) as Record<InvitationSectionKey, boolean>;

  return {
    templateId: isInvitationTemplateId(o.templateId) ? o.templateId : base.templateId,
    groomFullName: has('groomFullName') ? str(o.groomFullName, INVITATION_LIMITS.name) || base.groomFullName : base.groomFullName,
    brideFullName: has('brideFullName') ? str(o.brideFullName, INVITATION_LIMITS.name) || base.brideFullName : base.brideFullName,
    headline: has('headline') ? str(o.headline, INVITATION_LIMITS.headline) : base.headline,
    message: has('message') ? str(o.message, INVITATION_LIMITS.message) : base.message,
    quote: has('quote') ? str(o.quote, INVITATION_LIMITS.quote) : base.quote,
    groomFamily: has('groomFamily') ? family(o.groomFamily) : base.groomFamily,
    brideFamily: has('brideFamily') ? family(o.brideFamily) : base.brideFamily,
    events,
    story,
    memories,
    coverPhotoUrl: has('coverPhotoUrl') ? safeInvitationUrl(o.coverPhotoUrl) : base.coverPhotoUrl,
    coupleCutoutUrl: has('coupleCutoutUrl') ? safeInvitationUrl(o.coupleCutoutUrl) : base.coupleCutoutUrl,
    walkthroughGreeting: has('walkthroughGreeting') ? str(o.walkthroughGreeting, INVITATION_LIMITS.greeting) : base.walkthroughGreeting,
    music: { mode: musicMode as InvitationConfig['music']['mode'], url: musicUrl, track: musicTrack },
    sections,
    rsvpDeadline: has('rsvpDeadline') ? (o.rsvpDeadline ? iso(o.rsvpDeadline, '') : '') : base.rsvpDeadline,
    dressCode: has('dressCode') ? str(o.dressCode, INVITATION_LIMITS.dressCode) : base.dressCode,
    thankYou: has('thankYou') ? str(o.thankYou, INVITATION_LIMITS.thankYou) : base.thankYou,
  };
}

/** The stored config merged over defaults for this wedding (always complete) */
export function resolveInvitationConfig(stored: unknown, w: { groomName: string; brideName: string; weddingDate: string }): InvitationConfig {
  return sanitizeInvitationConfig(stored ?? {}, defaultInvitationConfig(w));
}

/** Google Maps search link for an address when the couple gave no map link */
export function invitationMapLink(e: Pick<InvitationEvent, 'mapUrl' | 'venueName' | 'address'>): string {
  if (e.mapUrl) return e.mapUrl;
  const q = [e.venueName, e.address].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

export interface InvitationRsvpInput {
  guestName: string;
  phone: string;
  attending: boolean;
  headcount: number;
  side: 'GROOM_SIDE' | 'BRIDE_SIDE' | 'FRIEND' | 'COLLEAGUE';
  note: string;
}

/* ───────────── Selling the invitation ───────────── */

/**
 * The 2D invitation is sold on its own (separate from 3D invitations and 3D halls). Designing is
 * free and saved as a draft; guests see it once published with one of these plans.
 */
export const INVITATION_PLANS = [
  { id: '1m', nameVi: '1 tháng', months: 1, priceVnd: 99_000 },
  { id: 'life', nameVi: 'Trọn đời', months: null, priceVnd: 599_000 },
] as const;

export const INVITATION_2D_PLANS = INVITATION_PLANS;

export type InvitationPlanId = (typeof INVITATION_PLANS)[number]['id'];

export function isInvitationPlanId(v: unknown): v is InvitationPlanId {
  return typeof v === 'string' && INVITATION_PLANS.some((p) => p.id === v);
}

/**
 * 3D Walkthrough invitations are sold at a dedicated tier (higher than 2D invitations).
 * Buying a 3D plan also permits using 2D templates; buying a 2D plan does NOT unlock 3D templates.
 */
export const INVITATION_3D_PLANS = [
  { id: '1m', nameVi: '1 tháng', months: 1, priceVnd: 199_000 },
  { id: 'life', nameVi: 'Trọn đời', months: null, priceVnd: 799_000 },
] as const;

export type Invitation3dPlanId = (typeof INVITATION_3D_PLANS)[number]['id'];

export function isInvitation3dPlanId(v: unknown): v is Invitation3dPlanId {
  return typeof v === 'string' && INVITATION_3D_PLANS.some((p) => p.id === v);
}

/** "Lifetime" is stored as this far-future date */
export const INVITATION_LIFETIME_UNTIL = '2999-12-31T00:00:00.000Z';

const LEGACY_PLAN_MONTHS: Record<string, number> = { '3m': 3, '6m': 6, '12m': 12 };

function addMonthsPlanEnd(months: number | null, currentUntil: string | null | undefined, now = new Date()): string {
  if (months === null) return INVITATION_LIFETIME_UNTIL;
  const cur = currentUntil ? new Date(currentUntil) : null;
  const from = cur && cur.getTime() > now.getTime() ? cur : now;
  const end = new Date(from);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end.toISOString();
}

/** New end of the publishing period for 2D invitations: a renewal adds onto time not yet used */
export function invitationPlanEnd(plan: InvitationPlanId | string, currentUntil: string | null | undefined, now = new Date()): string {
  const p = INVITATION_PLANS.find((x) => x.id === plan);
  const months = p ? p.months : (LEGACY_PLAN_MONTHS[plan] ?? 1);
  return addMonthsPlanEnd(months, currentUntil, now);
}

/** New end of the publishing period for 3D walkthrough invitations */
export function invitation3dPlanEnd(plan: Invitation3dPlanId | string, currentUntil: string | null | undefined, now = new Date()): string {
  const p = INVITATION_3D_PLANS.find((x) => x.id === plan);
  const months = p ? p.months : (LEGACY_PLAN_MONTHS[plan] ?? 1);
  return addMonthsPlanEnd(months, currentUntil, now);
}

export interface InvitationAccess {
  /** Guests can open the invitation */
  published: boolean;
  /** Why: a paid 3D hall includes it, a 3D plan, or a 2D plan */
  source: 'hall' | 'plan_3d' | 'plan' | null;
  /** End of the plan (ISO), null for "while the hall is active" or never bought */
  until: string | null;
  lifetime: boolean;
  /** A plan was bought and has run out */
  expired: boolean;
  /** Whether the resolved template is a 3D walkthrough template */
  is3D: boolean;
  /** True when only a 2D plan is active while attempting to publish a 3D template */
  needs3dUpgrade: boolean;
}

export function invitationAccess(
  w: {
    tier: string;
    status: string;
    invitationPaidUntil?: string | null;
    invitation3dPaidUntil?: string | null;
    invitationConfig?: unknown;
  },
  nowOrOpts?: number | { is3D?: boolean; templateId?: string | null; now?: number },
): InvitationAccess {
  const now = typeof nowOrOpts === 'number' ? nowOrOpts : (nowOrOpts?.now ?? Date.now());
  const storedTpl =
    w.invitationConfig && typeof w.invitationConfig === 'object'
      ? (w.invitationConfig as Record<string, unknown>).templateId
      : undefined;
  const is3D =
    typeof nowOrOpts === 'object' && nowOrOpts !== null
      ? (nowOrOpts.is3D ?? (nowOrOpts.templateId ? isWalkthrough3DTemplate(nowOrOpts.templateId) : isWalkthrough3DTemplate(storedTpl)))
      : isWalkthrough3DTemplate(storedTpl);

  const plan2dUntil = w.invitationPaidUntil ?? null;
  const plan2dActive = Boolean(plan2dUntil && Date.parse(plan2dUntil) > now);
  const plan3dUntil = w.invitation3dPaidUntil ?? null;
  const plan3dActive = Boolean(plan3dUntil && Date.parse(plan3dUntil) > now);

  // A paid hall includes both 2D and 3D invitations while it runs. The tier alone is not proof of payment:
  // a paid package chosen at creation sits in DRAFT until the transfer arrives.
  const hallIncluded = (w.tier === 'HAPPINESS' || w.tier === 'VIP_FULFILLMENT') && (w.status === 'PUBLISHED_3D' || w.status === 'GRACE_PERIOD_7D');

  if (is3D) {
    return {
      published: plan3dActive || hallIncluded,
      source: plan3dActive ? 'plan_3d' : hallIncluded ? 'hall' : null,
      until: plan3dActive ? plan3dUntil : null,
      lifetime: plan3dActive && plan3dUntil === INVITATION_LIFETIME_UNTIL,
      expired: Boolean(plan3dUntil) && !plan3dActive && !hallIncluded,
      is3D: true,
      needs3dUpgrade: plan2dActive && !plan3dActive && !hallIncluded,
    };
  }

  const pick3d = plan3dActive && (!plan2dActive || Date.parse(plan3dUntil!) >= Date.parse(plan2dUntil!));
  const bestUntil = pick3d ? plan3dUntil : plan2dActive ? plan2dUntil : null;

  return {
    published: plan2dActive || plan3dActive || hallIncluded,
    source: pick3d ? 'plan_3d' : plan2dActive ? 'plan' : hallIncluded ? 'hall' : null,
    until: bestUntil,
    lifetime: Boolean(bestUntil === INVITATION_LIFETIME_UNTIL),
    expired: Boolean(plan2dUntil || plan3dUntil) && !plan2dActive && !plan3dActive && !hallIncluded,
    is3D: false,
    needs3dUpgrade: false,
  };
}
