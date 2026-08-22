LAPORAN CAPSTONE DESIGN PROJECT

Sistem Informasi Penjualan UMKM Berbasis Web
untuk Meningkatkan Efisiensi Transaksi

Disusun untuk Memenuhi Tugas Mata Kuliah Capstone Design Project

Dosen Pengampu:
Dr.H. Sjamsyuridjal, MM



Disusun Oleh:
DEDY DARMAWAN SIMANJUNTAK (05102311070)
ABU DUJANAH SIREGAR (05102311068)

PROGRAM STUDI TEKNIK INDUSTRI
FAKULTAS TEKNIK - UNIVERSITAS NASIONAL PASIM
2026
KATA PENGANTAR
Puji dan syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa, karena atas rahmat dan karunia-Nya, laporan Capstone Design Project yang berjudul "Sistem Informasi Penjualan UMKM Berbasis Web untuk Meningkatkan Efisiensi Transaksi" ini dapat diselesaikan dengan baik dan tepat pada waktunya.
Laporan ini disusun guna memenuhi salah satu tugas serta syarat kelulusan mata kuliah Capstone Design Project pada Program Studi Teknik Industri, Fakultas Teknik, Universitas Nasional Pasim. Dalam penyusunannya, penulis menyadari bahwa keberhasilan laporan ini tidak lepas dari bimbingan, arahan, serta dukungan dari berbagai pihak. Oleh karena itu, pada kesempatan ini penulis ingin menyampaikan terima kasih yang sebesar-besarnya kepada:
1.	Bapak Dr.H. Sjamsyuridjal, MM, selaku Dosen Pengampu mata kuliah Capstone Design Project yang telah memberikan banyak ilmu, arahan, bimbingan, dan kesabaran selama proses penyusunan laporan ini.
2.	Seluruh dosen dan staf akademik Program Studi Teknik Industri Universitas Nasional Pasim yang telah membekali penulis dengan ilmu pengetahuan yang bermanfaat.
3.	Rekan kerja sama tim yang telah saling mendukung dan bekerja keras dalam menyelesaikan proyek ini.
4.	Orang tua dan keluarga tercinta yang selalu memberikan doa, dukungan moral, maupun material.
5.	Semua pihak yang tidak dapat disebutkan satu per satu, yang telah membantu kelancaran penyusunan laporan ini.
Penulis menyadari bahwa laporan ini masih jauh dari kesempurnaan, baik dari segi materi maupun teknik penyajiannya. Oleh karena itu, kritik dan saran yang membangun sangat penulis harapkan demi perbaikan di masa yang akan datang.
Akhir kata, semoga laporan Capstone Design Project ini dapat memberikan manfaat, wawasan baru, serta kontribusi positif bagi perkembangan ilmu pengetahuan, khususnya di bidang Teknik Industri dan pengembangan UMKM.

Bandung, Juli 2026

Tim Penulis
 Daftar Isi
BAB I	1
PENDAHULUAN	1
1.1 Latar Belakang	1
1.2 Rumusan Masalah	3
1.3 Tujuan Penelitian	4
1.4 Manfaat Penelitian	4
1.4.1 Bagi Pelaku UMKM	4
1.4.2 Bagi Pengembangan Ilmu Pengetahuan	5
1.4.3 Bagi Program Studi Teknik Industri	5
BAB II	16
TINJAUAN PUSTAKA	16
2.1 Konsep Usaha Mikro, Kecil, dan Menengah (UMKM)	16
2.2 Sistem Informasi	18
2.3 Safety Stock (Persediaan Pengaman)	19
2.3.1 Pengertian Safety Stock	19
2.3.2 Faktor yang Memengaruhi Safety Stock	19
2.4 Reorder Point (ROP)	20
2.5 Teknologi Pengembangan Sistem	21
2.5.1 React.js (Frontend Framework)	21
2.5.2 Node.js dan Express.js (Backend)	22
2.5.3 PostgreSQL (Database)	23
2.5.4 Tailwind CSS (Styling)	23
2.6 Basis Data (Database)	24
2.7 Metode Pengembangan Sistem (Waterfall)	25
BAB III	27
METODOLOGI PENGEMBANGAN SISTEM	27
3.1 Tahap Identifikasi dan Analisis Masalah	27
3.2 Tahap Analisis Kebutuhan Sistem	29
3.3 Spesifikasi Perancangan	30
3.4 Tahap Implementasi dan Pengkodean (Coding)	31
3.5 Tahap Pengujian Sistem (Testing dan Validasi)	32
3.6 Luaran Perancangan	33
3.7 Ruang Lingkup Capstone Design Project	35
3.8 Teknik dan Metode yang Digunakan	36
3.9 Jadwal Pelaksanaan	38
BAB IV	29
IDENTIFIKASI DAN ANALISIS SISTEM	29
4.1 Kondisi Sistem yang Berjalan	29
4.1.1 Proses Pencatatan Produk dan Stok	29
4.1.2 Proses Transaksi Penjualan	30
4.1.3 Proses Pencatatan Keuangan	30
4.1.4 Proses Pelaporan dan Pengambilan Keputusan	31
4.1.5 Ringkasan Permasalahan Sistem Berjalan	31
4.2 Kesimpulan Analisis	32
BAB V	35
PERANCANGAN PROSES SISTEM	35
5.1 Process Planning Chart (PPC)	35
5.2 Data Flow Diagram (DFD)	37
5.2.1 DFD Level 0 — Context Diagram	37
5.2.2 DFD Level 1 — Proses Utama	39
5.2.3 DFD Level 2 — Proses Transaksi Penjualan (P3.0)	40
5.3 Diagram OOP (Object Oriented Programming)	42
5.3.1 Struktur Hierarki Class	42
5.3.2 Relasi Antar Class	44
BAB VI	47
METODE PENGENDALIAN STOK	47
6.1 Reorder Point (ROP)	47
6.1.1 Penerapan ROP pada Sistem Informasi Penjualan UMKM	48
6.1.2 Contoh Perhitungan ROP	48
6.2 Safety Stock (SS)	49
6.2.1 Perhitungan Safety Stock	49
6.2.2 Faktor yang Memengaruhi Safety Stock	50
6.2.3 Penerapan Safety Stock pada Sistem Informasi Penjualan UMKM	51
6.2.4 Contoh Perhitungan Safety Stock	51
6.2.5 Kurva Hubungan Safety Stock dengan Service Level	52
BAB VII	54
DESAIN SISTEM	54
7.1 Desain Input dan Output	54
7.1.1 Desain Input	54
7.1.2 Desain Output	55
7.2 Desain Antarmuka Pengguna (UI)	56
7.2.1 Struktur Halaman Utama	56
7.2.2 Prinsip Desain Antarmuka	57
7.3 Arsitektur Sistem	58
7.3.1 Komponen Arsitektur MVC	58
7.3.2 Alur Komunikasi Sistem	59
7.3.3 Keamanan Sistem	59
7.4 Rancangan Basis Data	60
7.4.1 Tabel User	60
7.4.2 Tabel Product	61
7.4.3 Tabel Keranjang	63
7.4.4 Tabel Check_Out	64
7.4.5 Tabel History	65
7.5 Alur Program POS (Flowchart)	65

 
BAB I 
PENDAHULUAN
1.1 Latar Belakang
Usaha Mikro, Kecil, dan Menengah (UMKM) memiliki peran yang sangat strategis dalam perekonomian nasional. Berdasarkan data Kementerian Koperasi dan UKM tahun 2020, jumlah pelaku UMKM mencapai lebih dari 64 juta unit dengan kontribusi penyerapan tenaga kerja sebesar 97% serta sumbangan terhadap Produk Domestik Bruto (PDB) yang mencapai lebih dari 60%. Angka ini merefleksikan peran strategis UMKM dalam menjaga stabilitas ekonomi bangsa. Sektor ini dikenal sebagai tulang punggung perekonomian Indonesia karena mampu menyerap tenaga kerja dalam jumlah besar dan tersebar di berbagai daerah, termasuk wilayah pedesaan. Selain itu, UMKM juga memiliki ketahanan yang relatif kuat dalam menghadapi krisis ekonomi, karena sebagian besar tidak bergantung pada impor bahan baku dan lebih fleksibel dalam menyesuaikan kondisi pasar.
Namun demikian, besarnya kontribusi tersebut belum dibarengi dengan pengelolaan administrasi yang optimal. Dalam perkembangannya, banyak UMKM yang masih menghadapi kendala operasional, terutama dalam hal manajemen transaksi dan pencatatan penjualan. Sebagian besar UMKM masih mengandalkan sistem konvensional atau manual, seperti pencatatan di buku kas, yang rentan terhadap risiko kehilangan data, kesalahan penghitungan, serta memerlukan waktu yang cukup lama dalam setiap proses transaksi. Tantangan utama yang dihadapi adalah keterbatasan dalam manajemen transaksi, di mana sebagian besar UMKM masih mengandalkan metode pencatatan manual atau spreadsheet sederhana yang tidak terintegrasi. Praktik konvensional ini sangat rentan terhadap berbagai risiko, seperti kerusakan data fisik, kesalahan pencatatan (human error), sulitnya rekapitulasi data, hingga terhambatnya proses pelayanan kepada pelanggan.
Di era digital saat ini, efisiensi waktu dan akurasi data merupakan kunci utama untuk mempertahankan daya saing usaha. Keterlambatan dalam proses pelayanan transaksi tidak hanya menurunkan kepuasan pelanggan, tetapi juga menghambat pemilik UMKM dalam mengambil keputusan bisnis yang cepat akibat tidak adanya laporan penjualan yang real-time. Berdasarkan prinsip Teknik Industri, setiap pemborosan (waste) yang terjadi dalam proses operasional—termasuk waktu tunggu transaksi yang lama dan error pada pencatatan—harus dieliminasi melalui perancangan sistem yang terintegrasi.
Di sisi lain, pesatnya perkembangan teknologi informasi membuka peluang digitalisasi untuk meningkatkan efisiensi operasional. Pengembangan sistem informasi berbasis web menjadi solusi yang relevan karena keunggulannya dalam aspek aksesibilitas melalui browser tanpa memerlukan instalasi khusus, serta kemudahan dalam pemeliharaan sistem. Sistem ini memungkinkan integrasi data dari proses pemesanan, pembayaran, hingga pembuatan laporan keuangan secara otomatis. Dengan implementasi sistem informasi penjualan berbasis web, UMKM diharapkan dapat memangkas waktu siklus transaksi (transaction cycle time), meminimalkan risiko human error, serta meningkatkan efisiensi operasional secara keseluruhan.
Berdasarkan permasalahan tersebut, penulis merancang Sistem Informasi Penjualan UMKM Berbasis Web sebagai solusi digital yang komprehensif. Sistem ini dikembangkan menggunakan teknologi React.js pada sisi frontend, Node.js dengan framework Express.js pada sisi backend, dan PostgreSQL sebagai sistem manajemen basis data. Implementasi sistem ini bertujuan tidak hanya untuk meningkatkan efisiensi transaksi dan akurasi data, tetapi juga mendukung pengambilan keputusan bisnis yang lebih tepat guna meningkatkan daya saing UMKM di era digital.
Atas dasar pemikiran tersebut, penelitian Capstone Design Project ini dilakukan dengan judul "Sistem Informasi Penjualan UMKM Berbasis Web untuk Meningkatkan Efisiensi Transaksi".
1.2 Rumusan Masalah
Berdasarkan latar belakang yang telah dipaparkan, maka rumusan masalah dalam penelitian ini adalah sebagai berikut:
1.	Bagaimana kondisi efisiensi proses transaksi penjualan yang berjalan saat ini pada UMKM objek penelitian?
2.	Bagaimana merancang dan membangun sistem informasi penjualan berbasis web yang sesuai dengan kebutuhan operasional UMKM berdasarkan kaidah Analisis dan Perancangan Sistem Informasi?
3.	Bagaimana sistem informasi berbasis web dapat meningkatkan efisiensi proses transaksi dan akurasi pencatatan data penjualan pada UMKM?
4.	Bagaimana memastikan sistem yang dirancang memenuhi standar kualitas melalui penerapan prinsip Pengendalian dan Penjaminan Mutu?
1.3 Tujuan Penelitian
Adapun tujuan yang ingin dicapai melalui pelaksanaan Capstone Design Project ini adalah:
1.	Mengidentifikasi dan menganalisis hambatan serta tingkat efisiensi pada sistem transaksi penjualan konvensional yang saat ini diterapkan oleh UMKM.
2.	Merancang dan mengembangkan sistem informasi penjualan berbasis web yang komprehensif dan mudah digunakan, dengan menerapkan kaidah Analisis dan Perancangan Sistem Informasi.
3.	Mengimplementasikan antarmuka pengguna yang intuitif dan efisien berdasarkan prinsip-prinsip Ergonomi dan Perancangan Sistem Kerja.
4.	Memastikan kualitas sistem melalui serangkaian pengujian terstruktur yang mengacu pada prinsip Pengendalian dan Penjaminan Mutu.
5.	Mengukur dan mengevaluasi peningkatan efisiensi waktu serta akurasi data transaksi setelah diterapkannya sistem informasi berbasis web tersebut.
1.4 Manfaat Penelitian
1.4.1 Bagi Pelaku UMKM
1.	Mempercepat dan menyederhanakan proses transaksi penjualan sehingga pelayanan kepada pelanggan menjadi lebih cepat dan efisien.
2.	Mengurangi risiko kesalahan pencatatan (human error) yang sering terjadi pada metode pencatatan manual.
3.	Memudahkan pemantauan stok produk secara real-time sehingga pelaku usaha dapat menghindari kekurangan atau kelebihan stok.
4.	Menyediakan laporan penjualan yang akurat dan terstruktur sebagai dasar pengambilan keputusan bisnis yang lebih baik.
5.	Membantu pengelolaan arus kas usaha melalui pencatatan pemasukan dan pengeluaran secara otomatis dan terstruktur.
1.4.2 Bagi Pengembangan Ilmu Pengetahuan
1.	Memberikan kontribusi nyata pada penerapan ilmu Teknik Industri—khususnya Analisis dan Perancangan Sistem Informasi, Pengendalian Mutu, dan Ergonomi—dalam pengembangan sistem informasi di sektor UMKM.
2.	Menjadi referensi bagi penelitian-penelitian selanjutnya yang berkaitan dengan digitalisasi UMKM.
1.4.3 Bagi Program Studi Teknik Industri
1.	Menghasilkan karya nyata yang menunjukkan kemampuan mahasiswa dalam mengintegrasikan ilmu teknik industri dengan teknologi informasi untuk memecahkan masalah nyata di dunia usaha【2†L54-L55】.
2.	Menjadi bukti konkret atas kualitas pendidikan Program Studi Teknik Industri dalam menghasilkan lulusan yang mampu berinovasi.


BAB II
TINJAUAN PUSTAKA

2.1 Konsep Usaha Mikro, Kecil, dan Menengah (UMKM)
Usaha Mikro, Kecil, dan Menengah (UMKM) secara resmi didefinisikan dalam Undang-Undang Republik Indonesia Nomor 20 Tahun 2008 sebagai kelompok usaha produktif yang dimiliki oleh perorangan maupun badan usaha dengan kriteria tertentu berdasarkan jumlah kekayaan bersih dan hasil penjualan tahunan. Usaha Mikro merupakan usaha dengan kekayaan bersih paling banyak Rp50.000.000,00 (tidak termasuk tanah dan bangunan tempat usaha) atau memiliki hasil penjualan tahunan paling banyak Rp300.000.000,00. Usaha Kecil adalah usaha yang memiliki kekayaan bersih lebih dari Rp50.000.000,00 hingga Rp500.000.000,00, sedangkan Usaha Menengah memiliki kekayaan bersih lebih dari Rp500.000.000,00 hingga Rp10.000.000.000,00. Klasifikasi ini bertujuan untuk memberikan kejelasan dalam pembinaan, pengembangan, serta pemberian fasilitas dari pemerintah kepada pelaku usaha sesuai dengan skala dan kapasitasnya.
UMKM memiliki peran yang sangat strategis dalam pembangunan ekonomi nasional. Sektor ini dikenal sebagai tulang punggung perekonomian Indonesia karena mampu menyerap tenaga kerja dalam jumlah besar dan tersebar di berbagai daerah, termasuk wilayah pedesaan. Dengan jumlah pelaku usaha yang sangat banyak, UMKM turut berkontribusi signifikan terhadap Produk Domestik Bruto (PDB) serta mendorong pemerataan ekonomi. Selain itu, UMKM juga memiliki ketahanan yang relatif kuat dalam menghadapi krisis ekonomi, karena sebagian besar tidak bergantung pada impor bahan baku dan lebih fleksibel dalam menyesuaikan kondisi pasar.
Namun demikian, di balik perannya yang besar, UMKM masih menghadapi berbagai tantangan yang cukup kompleks. Salah satu tantangan utama adalah keterbatasan dalam mengadopsi teknologi digital, baik dalam hal pemasaran, pencatatan keuangan, maupun pengelolaan operasional usaha. Selain itu, akses terhadap permodalan juga masih menjadi kendala, terutama bagi pelaku usaha yang belum memiliki legalitas usaha atau laporan keuangan yang rapi. Permasalahan lain yang sering dihadapi adalah kurangnya kemampuan dalam manajemen administrasi dan pencatatan keuangan, sehingga menyulitkan dalam pengambilan keputusan bisnis.
Untuk mengatasi berbagai tantangan tersebut, diperlukan dukungan dari berbagai pihak, baik pemerintah, lembaga keuangan, maupun sektor swasta. Pemerintah telah menyediakan berbagai program seperti pelatihan kewirausahaan, bantuan permodalan, serta digitalisasi UMKM melalui platform online. Di sisi lain, pemanfaatan teknologi informasi seperti sistem informasi penjualan, aplikasi akuntansi, dan platform e-commerce dapat menjadi solusi untuk meningkatkan efisiensi dan daya saing UMKM. Dengan pengelolaan yang lebih modern dan terstruktur, diharapkan UMKM dapat berkembang lebih pesat, berdaya saing tinggi, serta mampu berkontribusi lebih besar terhadap pertumbuhan ekonomi nasional.

2.2 Sistem Informasi
Sistem informasi merupakan kombinasi yang terorganisir dari berbagai komponen, seperti manusia, perangkat keras (hardware), perangkat lunak (software), jaringan komunikasi, sumber daya data, serta kebijakan dan prosedur yang saling terintegrasi untuk mengolah dan menghasilkan informasi yang berguna bagi organisasi. Menurut Abdul Kadir (2014), sistem informasi berfungsi untuk menyimpan, mengambil kembali, mengolah, dan menyebarkan informasi guna mendukung proses operasional dan pengambilan keputusan. Dalam penerapannya, sistem informasi memiliki tiga aktivitas utama, yaitu input (proses pemasukan data), process (pengolahan data menjadi informasi yang bermakna), dan output (hasil keluaran berupa informasi yang dapat digunakan oleh pengguna).
Sementara itu, menurut Tata Sutabri (2012), sistem informasi adalah suatu sistem yang berada dalam sebuah organisasi yang dirancang untuk memenuhi kebutuhan pengolahan transaksi harian, mendukung kegiatan operasional, fungsi manajerial, hingga kegiatan strategis organisasi. Hal ini menunjukkan bahwa sistem informasi tidak hanya berperan sebagai alat pencatat data, tetapi juga sebagai pendukung utama dalam menjalankan berbagai aktivitas bisnis secara efektif dan efisien.
Dalam konteks UMKM, penerapan sistem informasi penjualan memberikan berbagai manfaat yang signifikan. Sistem ini mampu meningkatkan akurasi dalam pencatatan transaksi penjualan sehingga mengurangi risiko kesalahan pencatatan. Selain itu, proses pelayanan kepada pelanggan menjadi lebih cepat dan efisien karena data produk, stok, dan transaksi dapat diakses secara real-time. Sistem informasi juga memudahkan pelaku usaha dalam menyusun laporan keuangan secara otomatis dan terstruktur, sehingga mempermudah dalam melakukan evaluasi kinerja usaha. Lebih jauh lagi, data yang tersimpan dapat dianalisis untuk mengetahui tren penjualan, perilaku pelanggan, serta strategi bisnis yang lebih tepat.
2.3 Safety Stock (Persediaan Pengaman)
2.3.1 Pengertian Safety Stock
Safety stock atau persediaan pengaman adalah jumlah persediaan tambahan yang disimpan oleh perusahaan atau pelaku usaha untuk meminimalkan risiko terjadinya kekurangan persediaan (stockout atau shortage) akibat adanya ketidakpastian dalam permintaan pasar dan waktu tunggu pengiriman (lead time). Dalam operasional UMKM, ketidakpastian ini sering kali terjadi ketika permintaan konsumen tiba-tiba melonjak atau ketika pihak supplier terlambat mengirimkan barang.
Menurut konsep Teknik Industri dan Manajemen Persediaan, safety stock berfungsi sebagai penyangga (buffer) yang memisahkan antara proses pemenuhan permintaan konsumen dengan fluktuasi pasokan. Dengan adanya safety stock yang dihitung secara akurat, UMKM dapat menjaga kontinuitas penjualan, mempertahankan tingkat pelayanan konsumen (service level), dan menghindari hilangnya potensi keuntungan akibat barang tidak tersedia saat dibutuhkan.
2.3.2 Faktor yang Memengaruhi Safety Stock
Besar kecilnya jumlah persediaan pengaman yang harus disediakan oleh suatu usaha dipengaruhi oleh beberapa faktor utama, antara lain:
1.	Fluktuasi Permintaan (Demand Variability): Semakin tidak menentu atau dinamis pola pembelian konsumen, maka semakin besar pula safety stock yang dibutuhkan.
2.	Waktu Tunggu (Lead Time Variability): Jeda waktu dari saat barang dipesan hingga barang sampai di gudang. Jika supplier sering terlambat, maka jumlah persediaan pengaman harus ditingkatkan.
3.	Tingkat Pelayanan (Service Level): Kebijakan pemilik usaha mengenai seberapa besar persentase kesiapan mereka dalam memenuhi permintaan konsumen tanpa mengalami stockout. Semakin tinggi target service level (misalnya 95% atau 99%), maka safety stock yang harus disimpan akan semakin besar.
2.4 Reorder Point (ROP)
Reorder Point (ROP) atau titik pemesanan kembali adalah tingkat persediaan di mana perusahaan harus melakukan pemesanan ulang untuk menghindari terjadinya kekurangan stok. ROP dihitung berdasarkan kebutuhan selama lead time ditambah dengan safety stock. Secara matematis, ROP dapat dirumuskan sebagai berikut:
ROP = (d × L) + SS
di mana:
•	d = tingkat permintaan rata-rata per periode
•	L = lead time (waktu tunggu) dalam periode yang sama
•	SS = safety stock (persediaan pengaman)
Dengan menerapkan perhitungan ROP yang tepat, UMKM dapat menentukan kapan waktu yang paling tepat untuk melakukan pemesanan ulang barang sehingga stok tetap tersedia untuk memenuhi permintaan pelanggan tanpa mengalami kelebihan persediaan yang dapat membebani modal kerja.
2.5 Teknologi Pengembangan Sistem
2.5.1 React.js (Frontend Framework)
React.js merupakan sebuah library JavaScript open-source yang dikembangkan oleh Meta (sebelumnya Facebook) sejak tahun 2013, yang digunakan untuk membangun antarmuka pengguna (user interface) pada aplikasi web. React dirancang untuk mempermudah pembuatan tampilan yang interaktif dan dinamis dengan cara membagi UI menjadi bagian-bagian kecil yang disebut komponen. Setiap komponen dapat mengelola data dan tampilannya sendiri, sehingga pengembangan aplikasi menjadi lebih terstruktur dan mudah dipahami.
Salah satu keunggulan utama React.js adalah konsep komponen yang bersifat reusable, artinya komponen yang telah dibuat dapat digunakan kembali di berbagai bagian aplikasi tanpa harus menulis ulang kode yang sama. Hal ini sangat membantu dalam meningkatkan efisiensi pengembangan serta mempermudah proses pemeliharaan dan pengembangan lanjutan. Selain itu, React juga mendukung alur data satu arah (one-way data binding), yang membuat pengelolaan data menjadi lebih terkontrol dan meminimalkan terjadinya bug dalam aplikasi.
React.js juga menggunakan konsep Virtual DOM (Document Object Model), yaitu representasi virtual dari struktur DOM yang ada di browser. Dengan adanya Virtual DOM, React hanya akan memperbarui bagian tertentu dari tampilan yang mengalami perubahan, tanpa harus melakukan render ulang seluruh halaman. Mekanisme ini membuat proses rendering menjadi lebih cepat dan efisien, sehingga performa aplikasi tetap optimal meskipun memiliki banyak komponen dan interaksi pengguna yang kompleks.
2.5.2 Node.js dan Express.js (Backend)
Node.js merupakan sebuah runtime environment JavaScript yang memungkinkan bahasa JavaScript dijalankan di sisi server, bukan hanya di browser. Teknologi ini pertama kali dikembangkan oleh Ryan Dahl pada tahun 2009 dengan tujuan untuk menciptakan sistem yang mampu menangani banyak koneksi secara efisien. Node.js menggunakan mesin V8 JavaScript Engine dari Google Chrome, sehingga mampu mengeksekusi kode dengan cepat dan performa yang tinggi. Salah satu keunggulan utama Node.js adalah penggunaan model pemrograman asynchronous dan event-driven, yang memungkinkan proses non-blocking sehingga server dapat menangani banyak permintaan (request) secara bersamaan tanpa harus menunggu satu proses selesai terlebih dahulu.
Dengan karakteristik tersebut, Node.js sangat cocok digunakan untuk membangun aplikasi real-time seperti chat, sistem notifikasi, maupun aplikasi berbasis API yang membutuhkan respons cepat. Selain itu, Node.js juga memiliki ekosistem yang sangat luas melalui npm (Node Package Manager), yang menyediakan berbagai library dan tools untuk mempercepat proses pengembangan.
Di atas Node.js, terdapat Express.js yang merupakan framework web minimalis namun powerful. Express.js dirancang untuk mempermudah pengembangan aplikasi web dan API RESTful dengan menyediakan berbagai fitur seperti routing, middleware, pengelolaan request dan response, serta integrasi dengan berbagai template engine. Dengan menggunakan Express.js, pengembang dapat membangun struktur aplikasi yang lebih terorganisir dan mudah dikembangkan.
2.5.3 PostgreSQL (Database)
PostgreSQL (atau sering disebut Postgres) adalah sistem manajemen basis data (database) gratis dan terbuka (open-source) yang digunakan untuk menyimpan, mengelola, dan mengorganisasi data secara digital. Postgres termasuk dalam jenis database relasional, yang artinya data di dalamnya disimpan dalam bentuk tabel-tabel terstruktur (seperti baris dan kolom) yang saling berhubungan atau terikat satu sama lain melalui primary key (kode unik) dan foreign key (penghubung antar tabel).
Untuk mengoperasikannya, PostgreSQL menggunakan bahasa standar yang disebut SQL (Structured Query Language). Hal yang membuat Postgres berbeda dan lebih unggul dari database biasa adalah kemampuannya sebagai database "relasional objek". Artinya, Postgres tidak hanya bisa menyimpan data teks atau angka biasa, melainkan juga mampu mengenali tipe data yang lebih kompleks, fungsi buatan sendiri, hingga sifat pewarisan data (inheritance).
2.5.4 Tailwind CSS (Styling)
Tailwind CSS merupakan sebuah framework CSS yang mengusung pendekatan utility-first, yaitu menyediakan kumpulan class utilitas berukuran kecil yang dapat langsung digunakan untuk membangun tampilan antarmuka pengguna secara cepat dan efisien. Berbeda dengan framework CSS tradisional yang biasanya menyediakan komponen siap pakai, Tailwind CSS justru memberikan kebebasan penuh kepada pengembang untuk merancang desain sesuai kebutuhan dengan cara mengombinasikan berbagai class utilitas langsung di dalam HTML atau JSX.
Dengan pendekatan ini, pengembang tidak perlu lagi menulis banyak kode CSS secara terpisah, karena hampir seluruh styling dapat dilakukan langsung pada elemen yang digunakan. Hal ini tidak hanya mempercepat proses pengembangan, tetapi juga membantu menjaga konsistensi desain serta meminimalkan penulisan kode yang berulang. Selain itu, Tailwind CSS juga mendukung pembuatan desain yang responsif dengan mudah melalui sistem breakpoint yang telah disediakan, sehingga tampilan aplikasi dapat menyesuaikan dengan berbagai ukuran layar, mulai dari perangkat mobile hingga desktop.
2.6 Basis Data (Database)
Basis data atau database adalah kumpulan data yang terorganisir, saling berhubungan, dan disimpan secara sistematis dalam sebuah sistem komputer agar dapat diakses, dikelola, dan diperbarui dengan mudah (Thomas Connolly dan Carolyn Begg, 2015). Dalam sistem informasi penjualan UMKM ini, basis data berperan sebagai tempat penyimpanan seluruh data yang dibutuhkan sistem, termasuk data produk, data transaksi penjualan, data pelanggan, dan data pengguna sistem. Perancangan basis data menggunakan pendekatan normalisasi hingga bentuk normal ketiga (3NF) untuk memastikan struktur data yang optimal dan efisien.
2.7 Metode Pengembangan Sistem (Waterfall)
Metode Waterfall adalah model pengembangan perangkat lunak yang menggunakan pendekatan sekuensial atau berurutan. Dalam metode ini, setiap tahapan harus diselesaikan secara menyeluruh sebelum melanjutkan ke fase berikutnya, sehingga memberikan alur kerja yang sistematis, terstruktur, dan mudah dikendalikan.
Tahapan dalam metode ini meliputi:
1.	Analisis Kebutuhan: Identifikasi spesifikasi dan kebutuhan pengguna.
2.	Desain Sistem: Penerjemahan hasil analisis ke dalam arsitektur, basis data, dan antarmuka.
3.	Implementasi: Proses pengkodean desain ke dalam bahasa pemrograman.
4.	Pengujian: Verifikasi fungsionalitas sistem untuk memastikan bebas dari kesalahan.
5.	Pemeliharaan: Penyesuaian dan perbaikan sistem setelah diimplementasikan.






Gambar 2.1 Tahapan Model Waterfall
  
Sumber: Diadaptasi dari Pressman & Maxim (2019), diolah oleh penulis 2026

Metode Waterfall dipilih karena karakteristik kebutuhan sistem informasi penjualan UMKM ini cenderung stabil dan telah terdefinisi dengan baik sejak awal. Alurnya yang sederhana dan terdokumentasi secara detail memudahkan proses pengawasan serta evaluasi di setiap tahapannya, sehingga menjamin hasil akhir yang sesuai dengan rencana perancangan.



BAB III  
METODOLOGI PENGEMBANGAN SISTEM

3.1 Tahap Identifikasi dan Analisis Masalah
Tahap identifikasi dan analisis masalah merupakan tahapan awal yang dilakukan untuk memahami kondisi nyata proses bisnis dan operasional transaksi pada UMKM yang menjadi objek penelitian. Tahap ini bertujuan untuk mengidentifikasi berbagai kendala yang terjadi pada sistem yang sedang berjalan serta menentukan kebutuhan sistem yang akan dikembangkan sebagai solusi atas permasalahan tersebut.
Proses identifikasi dilakukan melalui observasi langsung terhadap aktivitas operasional UMKM, wawancara dengan pemilik usaha, serta analisis terhadap dokumen dan catatan transaksi yang digunakan sehari-hari. Dari hasil analisis tersebut diperoleh beberapa permasalahan utama yang memengaruhi efektivitas dan efisiensi pengelolaan usaha, yaitu sebagai berikut:
1. Lambatnya Waktu Pelayanan Transaksi Harian
 transaksi penjualan masih dilakukan secara manual, baik dalam pencatatan barang yang terjual maupun perhitungan total pembayaran. Kondisi ini menyebabkan waktu pelayanan menjadi lebih lama, terutama saat jumlah pelanggan meningkat pada jam-jam sibuk. Selain itu, proses perhitungan manual berpotensi menimbulkan kesalahan dalam pencatatan jumlah barang, harga jual, maupun total transaksi yang harus dibayarkan pelanggan.
2. Tidak Tersedianya Pencatatan Arus Kas yang Terstruktur
Sebagian besar transaksi keuangan UMKM hanya dicatat secara sederhana atau bahkan tidak terdokumentasi secara sistematis. Kondisi ini menyebabkan pemilik usaha kesulitan dalam mengetahui jumlah pemasukan dan pengeluaran yang sebenarnya dalam periode tertentu. Selain itu, tidak adanya laporan keuangan yang terdokumentasi dengan baik dapat menjadi hambatan ketika UMKM ingin mengajukan pinjaman atau pendanaan kepada lembaga keuangan maupun perbankan.
3. Risiko Kekosongan Stok Barang (Stock Out)
Pengelolaan persediaan barang masih dilakukan berdasarkan perkiraan atau pengecekan fisik secara berkala tanpa adanya sistem monitoring yang terintegrasi. Akibatnya, pemilik usaha sering terlambat mengetahui bahwa stok suatu produk telah mencapai batas minimum sehingga berisiko mengalami kehabisan barang saat permintaan pelanggan masih tinggi.
4. Sulitnya Penyusunan Laporan Penjualan dan Persediaan
Karena data transaksi dan stok masih dicatat secara manual, proses penyusunan laporan membutuhkan waktu yang relatif lama. Pemilik usaha harus melakukan rekapitulasi data satu per satu sehingga rentan terhadap kesalahan pencatatan maupun kehilangan data.
5. Kurangnya Ketersediaan Informasi untuk Pengambilan Keputusan
Data operasional yang tersebar dan tidak terintegrasi menyebabkan pemilik usaha kesulitan memperoleh informasi penting, seperti produk terlaris, tren penjualan, jumlah stok yang tersedia, serta kondisi arus kas usaha. Padahal informasi tersebut sangat dibutuhkan untuk menentukan strategi bisnis yang tepat.
Berdasarkan hasil identifikasi permasalahan tersebut, diperlukan sebuah sistem informasi manajemen penjualan dan persediaan yang mampu mengotomatisasi proses transaksi, mencatat arus kas secara terstruktur, mengelola persediaan barang secara real-time, serta menghasilkan laporan yang akurat dan mudah diakses.
3.2 Tahap Analisis Kebutuhan Sistem
Berdasarkan hasil observasi dan analisis terhadap permasalahan yang ditemukan pada UMKM, dilakukan identifikasi kebutuhan fungsional sistem yang bertujuan untuk meningkatkan efektivitas pengelolaan persediaan dan keuangan usaha. Kebutuhan sistem yang diidentifikasi adalah sebagai berikut:
•	Fitur Manajemen Stok: Sistem dirancang untuk membantu pengelolaan persediaan barang secara lebih terstruktur dan akurat dengan mengintegrasikan metode Safety Stock. Fitur ini memungkinkan sistem menghitung batas minimum stok aman berdasarkan data penjualan dan kebutuhan persediaan. Selain itu, sistem dapat memberikan informasi mengenai jumlah stok yang tersedia secara real-time sehingga pemilik usaha dapat mengambil keputusan pembelian barang dengan lebih tepat.
•	Fitur Laporan Keuangan: Sistem dirancang untuk mencatat seluruh aktivitas keuangan usaha yang meliputi transaksi pemasukan dan pengeluaran secara otomatis. Data transaksi yang tersimpan akan diolah menjadi laporan arus kas (cash flow) yang terstruktur, akurat, dan mudah dipahami. Fitur ini membantu pemilik usaha dalam memantau kondisi keuangan, mengetahui pergerakan kas selama periode tertentu, serta melakukan evaluasi terhadap kinerja usaha.
3.3 Spesifikasi Perancangan
Pada tahap spesifikasi perancangan, dilakukan identifikasi dan pendefinisian secara detail mengenai kebutuhan dan karakteristik sistem yang akan dikembangkan. Sistem yang dikembangkan adalah Sistem Informasi Penjualan UMKM Berbasis Web yang bertujuan untuk membantu para pelaku UMKM dalam mengelola proses transaksi penjualan secara digital, cepat, akurat, dan terstruktur.
Sistem ini dirancang untuk dapat diakses melalui browser web standar tanpa memerlukan instalasi aplikasi tambahan. Spesifikasi teknis sistem meliputi penggunaan React.js versi 18 sebagai library frontend, Node.js dengan framework Express.js sebagai backend, serta PostgreSQL sebagai sistem manajemen basis data. Sistem juga mengimplementasikan mekanisme autentikasi menggunakan JSON Web Token (JWT).
Berikut adalah ringkasan teknologi yang digunakan:
Tabel 3.1 Teknologi yang Digunakan dalam Pengembangan Sistem
Komponen	Teknologi	Keterangan
Frontend	React.js 18	Library JavaScript untuk membangun UI berbasis komponen
Backend	Node.js + Express.js	Runtime dan framework untuk membangun RESTful API
Database	PostgreSQL	Sistem manajemen basis data relasional open-source
Styling	Tailwind CSS	Framework CSS utility-first untuk desain responsif
Server	Apache / Nginx	Web server untuk men-deploy aplikasi
Tools	VS Code, Postman, Git	Alat pengembangan, pengujian API, dan version control

3.4 Tahap Implementasi dan Pengkodean (Coding)
Pada tahap ini, seluruh hasil perancangan sistem yang telah dibuat pada tahap sebelumnya ditransformasikan ke dalam bentuk kode program sehingga dapat dijalankan sebagai aplikasi berbasis web. Proses implementasi dilakukan dengan mengembangkan setiap fitur sesuai dengan kebutuhan yang telah dianalisis, mulai dari pengelolaan data stok, pencatatan transaksi penjualan, hingga pencatatan arus kas usaha.
•	Pengembangan Bagian Depan (Front-End): Bagian depan sistem dikembangkan sebagai antarmuka yang digunakan langsung oleh pengguna untuk berinteraksi dengan aplikasi. Tampilan dirancang agar responsif, mudah dipahami, dan dapat diakses melalui berbagai perangkat seperti komputer maupun smartphone. Selain itu, antarmuka dibuat dengan memperhatikan kemudahan navigasi sehingga pengguna dapat melakukan pengelolaan data, melihat informasi stok, serta mengakses laporan keuangan dengan lebih cepat dan efisien.
•	Pengembangan Bagian Belakang (Back-End) dan Basis Data: Bagian belakang sistem dikembangkan untuk mengelola logika bisnis, pemrosesan data, serta komunikasi antara antarmuka pengguna dan basis data. Sistem dihubungkan dengan PostgreSQL sebagai media penyimpanan data utama yang digunakan untuk menyimpan informasi produk, transaksi penjualan, data persediaan, serta catatan pemasukan dan pengeluaran kas. Implementasi basis data dilakukan dengan memperhatikan integritas, konsistensi, dan keamanan data sehingga informasi yang tersimpan dapat digunakan sebagai dasar pengambilan keputusan yang akurat.
3.5 Tahap Pengujian Sistem (Testing dan Validasi)
Setelah proses implementasi dan pengkodean selesai dilakukan, tahap berikutnya adalah pengujian sistem untuk memastikan seluruh fitur dapat berjalan sesuai dengan kebutuhan yang telah ditentukan. Pengujian ini bertujuan untuk menemukan dan memperbaiki kesalahan (bug), memastikan keakuratan hasil yang dihasilkan sistem, serta memverifikasi bahwa sistem mampu mendukung aktivitas operasional UMKM secara efektif. Pengujian dilakukan menggunakan dua pendekatan utama:
•	Pengecekan Fungsi (Black-Box Testing): Pengujian dilakukan dengan memeriksa seluruh fungsi sistem dari sisi pengguna tanpa melihat struktur kode program yang digunakan. Setiap fitur diuji berdasarkan masukan (input) dan keluaran (output) yang dihasilkan untuk memastikan bahwa sistem memberikan respons yang sesuai dengan kebutuhan pengguna.
•	Validasi Output Sistem: Validasi dilakukan untuk memastikan bahwa informasi dan laporan yang dihasilkan sistem memiliki tingkat akurasi yang tinggi dan sesuai dengan kondisi operasional yang sebenarnya. Proses validasi difokuskan pada hasil perhitungan stok, pencatatan arus kas, serta laporan keuangan yang dihasilkan secara otomatis oleh sistem.

3.6 Luaran Perancangan
Luaran atau output yang dihasilkan dari penelitian dan pengembangan Capstone Design Project ini adalah sebuah aplikasi sistem informasi penjualan berbasis web yang fungsional, siap digunakan, dan telah melalui serangkaian pengujian. Secara lebih rinci, luaran yang dihasilkan mencakup komponen-komponen utama berikut:
1.	Aplikasi web sistem informasi penjualan yang dapat diakses melalui browser dengan tampilan yang modern, responsif, dan mudah digunakan.
2.	Database PostgreSQL yang terstruktur dan ternormalisasi, berisi tabel-tabel data yang dibutuhkan sistem.
3.	API RESTful berbasis Node.js dan Express.js yang menghubungkan frontend dengan database secara aman dan efisien.
4.	Antarmuka pengguna (User Interface) yang intuitif dan responsif untuk seluruh fitur sistem.
5.	Laporan hasil pengujian Black Box Testing yang mendokumentasikan seluruh skenario uji.
6.	Dokumentasi teknis sistem yang mencakup dokumentasi API, struktur database, dan panduan penggunaan aplikasi.
Berikut adalah daftar fitur lengkap yang akan diimplementasikan:
Tabel 3.2 Daftar Fitur Sistem Informasi Penjualan UMKM
Kode	Fitur	Deskripsi	Prioritas
F-01	Login & Autentikasi	Sistem login dengan validasi username dan password menggunakan JWT	Tinggi
F-02	Kelola Data Produk	CRUD data produk: tambah, ubah, hapus, cari produk	Tinggi
F-03	Input Transaksi	Pencatatan transaksi penjualan dengan detail item dan total harga	Tinggi
F-04	Laporan Penjualan	Tampilan laporan harian, mingguan, dan bulanan dengan filter periode	Tinggi
F-05	Manajemen Pelanggan	Penyimpanan dan pengelolaan data pelanggan	Sedang
F-06	Cetak Struk/Invoice	Generate dan cetak struk transaksi secara otomatis dalam format PDF	Sedang
F-07	Dashboard Statistik	Tampilan kartu ringkasan: total produk, transaksi hari ini, pendapatan	Tinggi
F-08	Manajemen Pengguna	Pengelolaan akun dan role pengguna oleh admin	Rendah

3.7 Ruang Lingkup Capstone Design Project
Ruang lingkup penelitian ini perlu dibatasi secara jelas agar fokus pengembangan dapat terarah dan hasil yang dicapai dapat terukur dengan baik. Adapun ruang lingkup Capstone Design Project ini meliputi hal-hal berikut:
1.	Sistem dikembangkan sebagai aplikasi berbasis web yang dapat diakses melalui browser web standar pada perangkat komputer desktop, laptop, maupun perangkat mobile.
2.	Perancangan arsitektur sistem mengacu pada kaidah Analisis dan Perancangan Sistem Informasi, meliputi Flowchart, Use Case Diagram, ERD, dan desain antarmuka pengguna.
3.	Sistem mencakup modul pengelolaan data produk, pencatatan transaksi penjualan, pemantauan stok barang, serta pembuatan laporan penjualan secara otomatis.
4.	Perancangan antarmuka pengguna mengacu pada prinsip-prinsip Ergonomi dan Perancangan Sistem Kerja.
5.	Pengujian sistem dilakukan menggunakan metode Black Box Testing sesuai prinsip Pengendalian dan Penjaminan Mutu.
6.	Sistem menggunakan React.js sebagai frontend, Node.js sebagai backend, dan PostgreSQL sebagai database, dengan autentikasi berbasis JWT.
7.	Sistem tidak mencakup fitur integrasi pembayaran digital, manajemen gudang multi-lokasi, atau fitur e-commerce.
3.8 Teknik dan Metode yang Digunakan
Dalam pelaksanaan penelitian dan pengembangan Capstone Design Project ini, digunakan beberapa teknik dan metode yang mengintegrasikan keilmuan Program Studi Teknik Industri dengan praktik pengembangan sistem informasi.
1. Observasi dan Analisis Proses Bisnis (Manajemen Industri)
Teknik observasi dilakukan dengan mengamati langsung proses transaksi penjualan pada UMKM. Pendekatan ini mengacu pada prinsip Manajemen Industri dalam melakukan pemetaan proses bisnis. Hasil observasi berupa dokumentasi proses as-is yang dianalisis untuk mengidentifikasi bottleneck dan inefisiensi, sebagai dasar perancangan proses to-be yang lebih optimal dengan dukungan sistem informasi.
2. Studi Literatur
Studi literatur merupakan salah satu metode pengumpulan data yang dilakukan dengan cara mengkaji dan mempelajari berbagai sumber referensi yang relevan dengan topik penelitian. Sumber-sumber tersebut meliputi buku teks yang membahas sistem informasi, rekayasa perangkat lunak, dan basis data; jurnal ilmiah yang mengulas penerapan sistem informasi pada UMKM; dokumentasi resmi dari teknologi yang digunakan; serta laporan penelitian terdahulu.
3. Perancangan Sistem (Analisis dan Perancangan Sistem Informasi)
Perancangan sistem dilakukan secara sistematis menggunakan alat bantu standar untuk menggambarkan alur, interaksi, dan struktur data secara menyeluruh sebelum tahap implementasi. Alat bantu yang digunakan meliputi:
1.	Flowchart & Use Case Diagram: Digunakan untuk memvisualisasikan alur proses logis sistem dan memetakan interaksi antara aktor dengan fitur-fitur fungsional.
2.	Entity Relationship Diagram (ERD): Berfungsi merancang struktur basis data dengan menetapkan relasi antar entitas, atribut, serta kunci utama.
3.	Wireframe & Mockup: Digunakan untuk merancang antarmuka pengguna (user interface).
4. Metode Pengembangan Waterfall
 Waterfall dipilih sebagai metodologi pengembangan sistem karena kebutuhan yang telah terdefinisi dengan jelas sejak tahap awal perencanaan. Metode ini menawarkan struktur kerja yang sistematis dan berurutan, dimulai dari analisis kebutuhan, desain sistem, implementasi, pengujian, hingga pemeliharaan.
5. Black Box Testing (Pengendalian dan Penjaminan Mutu)
Pengujian sistem dilakukan menggunakan metode Black Box Testing sebagai implementasi dari prinsip Pengendalian dan Penjaminan Mutu. Setiap fitur sistem diuji berdasarkan skenario yang telah disiapkan, membandingkan hasil aktual dengan hasil yang diharapkan.
Tabel 3.3 Rencana Pengujian Sistem (Black Box Testing)
Kode	Skenario	Input	Hasil Diharapkan	Status
TC-01	Login dengan data valid	Username & password benar	Login berhasil, masuk dashboard	Berhasil
TC-02	Login dengan data invalid	Username / password salah	Muncul pesan error autentikasi	Berhasil
TC-03	Tambah produk baru	Isi form produk lengkap	Produk tersimpan di database	Berhasil
TC-04	Input transaksi penjualan	Pilih produk & jumlah	Transaksi tercatat, stok berkurang	Berhasil
TC-05	Lihat laporan penjualan	Pilih rentang tanggal	Laporan tampil sesuai filter	Berhasil
TC-06	Cetak struk transaksi	Klik tombol cetak	File PDF struk ter-generate	Berhasil

3.9 Jadwal Pelaksanaan
Jadwal pelaksanaan penelitian dan pengembangan Capstone Design Project ini dirancang secara realistik dengan mempertimbangkan kompleksitas setiap tahapan pekerjaan, ketersediaan sumber daya, dan batas waktu penyelesaian yang telah ditentukan.
Tabel 3.4 Jadwal Pelaksanaan Capstone Design Project
No	KEGIATAN	Minggu ke-
1	Pedoman	1
2	Penentuan Produk	2
3	Proposal CPD	3-4
4	Rancangan Sistem Informasi Web - Arsitektur Sistem & Database (ERD) - Desain User Interface (Mockup)	5-6
5	Gambar Poster & X Banner	7
6	UTS	8
7	Prototipe produk lengkap (Sistem Web UMKM) - Desain UI/UX & Database - Coding Frontend & Backend - Integrasi Fitur Transaksi & API	9-12
8	Uji coba produk	13
9	Membuat Laporan Akhir	14-15
10	Presentasi UAS	16

BAB IV
IDENTIFIKASI DAN ANALISIS SISTEM

4.1 Kondisi Sistem yang Berjalan
Berdasarkan hasil observasi dan wawancara yang telah dilakukan pada UMKM objek penelitian, diperoleh gambaran mengenai kondisi sistem transaksi penjualan yang sedang berjalan saat ini. Sistem yang digunakan oleh UMKM tersebut masih sepenuhnya bersifat konvensional dan manual, tanpa dukungan teknologi informasi yang memadai. Seluruh proses bisnis mulai dari pencatatan produk, transaksi penjualan, hingga pelaporan keuangan masih dilakukan dengan cara-cara tradisional yang memiliki berbagai kelemahan dan risiko operasional.
4.1.1 Proses Pencatatan Produk dan Stok
Dalam sistem yang berjalan saat ini, data produk dicatat secara manual dalam buku inventaris atau catatan sederhana. Setiap kali terjadi penambahan produk baru, pemilik usaha harus menuliskan secara manual nama produk, harga, dan jumlah stok yang tersedia. Proses ini sangat rentan terhadap kesalahan penulisan, kehilangan data, dan kesulitan dalam melakukan pencarian data produk ketika dibutuhkan.
Pengelolaan stok barang dilakukan dengan cara pengecekan fisik secara periodik, yaitu dengan menghitung langsung jumlah barang yang tersedia di rak atau gudang. Metode ini memakan waktu yang cukup lama dan tidak memberikan informasi stok secara real-time. Akibatnya, pemilik usaha sering kali baru mengetahui bahwa stok suatu produk telah habis ketika pelanggan datang dan meminta produk tersebut, yang berakibat pada hilangnya potensi penjualan.
4.1.2 Proses Transaksi Penjualan
Proses transaksi penjualan dilakukan secara manual dengan langkah-langkah sebagai berikut:
1.	Pelanggan memilih produk yang akan dibeli dan menyerahkannya kepada kasir.
2.	Kasir mencatat produk yang dipilih beserta harganya secara manual di buku catatan atau kertas nota.
3.	Kasir menghitung total harga yang harus dibayar oleh pelanggan menggunakan kalkulator atau perhitungan manual.
4.	Pelanggan melakukan pembayaran, dan kasir mencatat pembayaran tersebut.
5.	Kasir membuat struk pembelian sederhana yang ditulis tangan.
Proses manual ini memiliki beberapa kelemahan signifikan. Pertama, waktu yang dibutuhkan untuk melayani satu pelanggan menjadi relatif lama karena kasir harus menulis dan menghitung secara manual. Kedua, risiko kesalahan perhitungan sangat tinggi, terutama ketika terdapat banyak item dalam satu transaksi atau ketika pelanggan datang secara bersamaan dalam jumlah banyak. Ketiga, tidak adanya sistem yang terintegrasi menyebabkan data transaksi tidak dapat langsung diperbarui ke dalam catatan stok, sehingga sering terjadi ketidaksesuaian antara data penjualan dan data stok yang tersedia.
4.1.3 Proses Pencatatan Keuangan
Pencatatan keuangan pada UMKM objek penelitian masih dilakukan dengan cara yang sangat sederhana. Pemasukan dan pengeluaran usaha dicatat dalam buku kas manual yang berisi kolom tanggal, keterangan, pemasukan, dan pengeluaran. Meskipun metode ini cukup mudah dilakukan, namun memiliki keterbatasan yang serius.
Pertama, proses rekapitulasi keuangan untuk mengetahui laba rugi dalam periode tertentu membutuhkan waktu yang cukup lama karena pemilik usaha harus menjumlahkan seluruh data secara manual. Kedua, risiko kesalahan penjumlahan sangat tinggi, terutama jika jumlah transaksi yang tercatat sudah banyak. Ketiga, tidak adanya laporan keuangan yang terstruktur dan profesional menyebabkan UMKM kesulitan ketika ingin mengajukan pinjaman atau pendanaan ke lembaga perbankan, karena laporan keuangan yang rapi dan akurat merupakan salah satu syarat utama dalam proses penilaian kelayakan kredit.
4.1.4 Proses Pelaporan dan Pengambilan Keputusan
Karena seluruh data transaksi dan stok tersebar dalam catatan-catatan manual yang tidak terintegrasi, pemilik usaha mengalami kesulitan yang signifikan dalam menyusun laporan penjualan dan kondisi usaha secara keseluruhan. Informasi penting seperti produk terlaris, tren penjualan, dan kondisi arus kas tidak dapat diperoleh dengan cepat dan akurat.
Hal ini berdampak pada kualitas pengambilan keputusan bisnis yang dilakukan oleh pemilik usaha. Tanpa data yang akurat dan terkini, pemilik usaha cenderung mengambil keputusan berdasarkan perkiraan atau intuisi semata, yang tidak selalu tepat dan dapat berisiko bagi kelangsungan usaha.
4.1.5 Ringkasan Permasalahan Sistem Berjalan
Berdasarkan uraian di atas, permasalahan utama yang dihadapi oleh UMKM objek penelitian dapat dirangkum dalam tabel berikut:
Tabel 4.1 Identifikasi Permasalahan Sistem Berjalan
No	Aspek Permasalahan	Deskripsi	Dampak
1	Pencatatan Produk	Manual dalam buku inventaris	Rentan kesalahan, sulit mencari data
2	Pengelolaan Stok	Pengecekan fisik periodik	Tidak real-time, sering stockout
3	Transaksi Penjualan	Manual dengan catatan tangan	Waktu lama, risiko kesalahan hitung
4	Pencatatan Keuangan	Buku kas manual	Sulit rekapitulasi, tidak profesional
5	Pelaporan	Tidak terstruktur	Sulit evaluasi usaha
6	Pengambilan Keputusan	Berbasis intuisi	Kurang akurat, berisiko

4.2 Kesimpulan Analisis
Berdasarkan hasil identifikasi dan analisis kondisi sistem yang berjalan pada UMKM objek penelitian, dapat ditarik beberapa kesimpulan penting sebagai berikut:
1.	Sistem konvensional yang digunakan saat ini tidak efektif dan efisien dalam mendukung operasional transaksi penjualan. Proses manual yang diterapkan menyebabkan waktu pelayanan yang lama, risiko kesalahan pencatatan yang tinggi, serta kesulitan dalam pengelolaan data secara terintegrasi.
2.	Pengelolaan stok barang masih sangat lemah karena tidak adanya sistem monitoring yang terintegrasi. Pemilik usaha sering kali tidak mengetahui secara pasti jumlah stok yang tersedia, sehingga berisiko mengalami kehabisan stok (stockout) atau kelebihan stok yang membebani modal.
3.	Pencatatan keuangan tidak terstruktur sehingga menyulitkan pemilik usaha dalam mengetahui kondisi keuangan usaha secara akurat. Hal ini juga menjadi hambatan ketika UMKM ingin mengakses permodalan dari lembaga keuangan.
4.	Kurangnya informasi yang akurat dan terkini menghambat proses pengambilan keputusan bisnis. Pemilik usaha tidak memiliki data yang cukup untuk menentukan strategi pemasaran, pengelolaan produk, maupun perencanaan keuangan.
5.	Diperlukan solusi sistem informasi yang terintegrasi untuk mengatasi seluruh permasalahan tersebut. Sistem yang dirancang harus mampu mengotomatisasi proses transaksi, mengelola stok secara real-time, mencatat keuangan secara terstruktur, serta menyediakan laporan yang akurat dan mudah diakses.
Dengan demikian, pengembangan Sistem Informasi Penjualan UMKM Berbasis Web menjadi sangat relevan dan mendesak untuk dilakukan guna meningkatkan efisiensi operasional, akurasi data, serta daya saing UMKM di era digital.














BAB V
PERANCANGAN PROSES SISTEM

5.1 Process Planning Chart (PPC)
Process Planning Chart (PPC) atau bagan perencanaan proses merupakan representasi sistematis dari seluruh tahapan yang diperlukan dalam pengembangan sistem informasi penjualan UMKM berbasis web. PPC berfungsi sebagai panduan yang menguraikan secara kronologis aktivitas-aktivitas yang harus dilakukan, mulai dari tahap awal perencanaan hingga tahap akhir implementasi dan pemeliharaan sistem.
Perencanaan proses ini sangat penting untuk memastikan bahwa setiap tahapan pengembangan sistem berjalan sesuai dengan jadwal yang telah ditentukan, sumber daya yang tersedia dapat dialokasikan secara optimal, dan risiko keterlambatan atau kegagalan proyek dapat diminimalkan.
Berikut adalah Process Planning Chart (PPC) untuk pengembangan Sistem Informasi Penjualan UMKM Berbasis Web:
Tabel 5.1 Process Planning Chart (PPC) Pengembangan Sistem
No	Fase / Aktivitas	Durasi	Output	Penanggung Jawab
1	Analisis Kebutuhan Sistem	1 Minggu	Dokumen SRS (Software Requirements Specification)	System Analyst
2	Perancangan Basis Data	3 Hari	ERD & Schema Database	Database Administrator
3	Perancangan DFD & DOOP	3 Hari	Dokumen DFD Level 0, 1, 2 & DOOP	System Analyst
4	Perancangan UI/UX Prototype	4 Hari	Wireframe & Mockup Antarmuka	Frontend Developer
5	Pengembangan Backend & API	2 Minggu	Kode Node.js/Express.js, REST API Endpoint	Backend Developer
6	Pengembangan Frontend	1 Minggu	Antarmuka Web Responsif (React.js/Tailwind CSS)	Frontend Developer
7	Integrasi Frontend-Backend	3 Hari	Sistem Terintegrasi Penuh	Backend & Frontend Dev
8	Pengujian Sistem (Testing)	4 Hari	Laporan Pengujian & Bug Report	QA Tester
9	Perbaikan Bug & Revisi	3 Hari	Sistem Final Siap Deploy	Tim Developer
10	Deployment & Pelatihan User	2 Hari	Sistem Online & User Terlatih	Project Manager
	Total Durasi Pengembangan	~ 6 Minggu		

5.2 Data Flow Diagram (DFD)
Data Flow Diagram (DFD) merupakan representasi grafis dari aliran data dalam suatu sistem. DFD menunjukkan bagaimana data bergerak masuk dan keluar dari proses-proses yang terdapat dalam sistem, serta bagaimana data disimpan dan diambil dari penyimpanan data. DFD pada sistem informasi penjualan UMKM ini disusun dalam tiga tingkatan: DFD Level 0 (Context Diagram), DFD Level 1, dan DFD Level 2.
5.2.1 DFD Level 0 — Context Diagram
Context Diagram atau DFD Level 0 merupakan gambaran paling tinggi dari sistem yang menampilkan sistem secara keseluruhan sebagai satu proses tunggal beserta entitas eksternal yang berinteraksi dengan sistem. Entitas eksternal (external entity) pada sistem ini adalah:
•	Administrator: Pengelola sistem yang memiliki akses penuh terhadap seluruh fitur, termasuk manajemen pengguna, produk, dan laporan.
•	Kasir / Operator: Pengguna yang bertugas melakukan input transaksi penjualan dan pengelolaan keranjang belanja.
•	Pelanggan: Pihak yang melakukan pembelian dan menerima struk transaksi dari sistem.

Gambar 5.1 Context Diagram (DFD Level 0)
 
Sumber: Hasil analisis dan perancangan penulis (2026)
Tabel 5.2 Entitas Eksternal dan Aliran Data - Context Diagram
Entitas	Input ke Sistem	Output dari Sistem
Administrator	Data login, data produk baru, data kategori, data pengguna	Laporan penjualan, laporan stok, laporan keuangan, konfirmasi aksi
Kasir / Operator	Data login, data transaksi (ID produk, jumlah), data checkout	Struk transaksi, info stok produk, riwayat transaksi
Pelanggan	Permintaan produk, data pembayaran	Nota/struk pembelian, total tagihan

5.2.2 DFD Level 1 — Proses Utama
DFD Level 1 membagi fungsionalitas sistem ke dalam beberapa proses utama yang saling terintegrasi. Alur dimulai dari Manajemen Autentikasi (P1.0) untuk validasi akses pengguna. Pengelolaan data inti dilakukan melalui Manajemen Produk (P2.0) sebagai basis informasi barang dan stok, serta Manajemen Pengguna (P6.0) untuk pengaturan akun oleh administrator.
Operasional utama sistem difokuskan pada Proses Transaksi Penjualan (P3.0) dan Manajemen Checkout (P4.0). Dalam fase ini, input keranjang diproses hingga tahap finalisasi yang mencakup pengurangan stok otomatis, verifikasi pembayaran, dan perekaman data ke basis data.
Sebagai fungsi pendukung dan manajerial, terdapat proses Riwayat Transaksi (P5.0) untuk pelacakan data pembelian dan Pelaporan (P7.0) yang mengonversi data transaksi menjadi laporan operasional.



Gambar 5.2 DFD Level 1 — Proses Utama
 
Sumber: Hasil analisis dan perancangan penulis (2026)
5.2.3 DFD Level 2 — Proses Transaksi Penjualan (P3.0)
DFD Level 2 menjabarkan proses transaksi penjualan (P3.0) menjadi sub-proses yang lebih detail. Proses ini merupakan inti dari sistem informasi penjualan UMKM dan melibatkan interaksi dengan beberapa penyimpanan data.





Gambar 5.3 DFD Level 2 — Proses Transaksi Penjuala 
Sumber: Hasil analisis dan perancangan penulis (2026)
Deskripsi Sub-Proses Transaksi Penjualan:
•	P3.1 Pencarian dan Tampil Produk: Sistem mengambil data produk dari tabel 'product' berdasarkan kategori atau keyword pencarian yang dimasukkan kasir.
•	P3.2 Tambah Item ke Keranjang: Sistem menyimpan item yang dipilih ke dalam tabel 'keranjang' dengan referensi id_product dan id_akun pengguna aktif.
•	P3.3 Update Jumlah / Hapus Item: Sistem memperbarui atau menghapus record pada tabel 'keranjang' sesuai aksi yang dilakukan kasir.
•	P3.4 Kalkulasi Total Transaksi: Sistem menghitung total harga berdasarkan harga produk dikalikan jumlah item dalam keranjang.
•	P3.5 Proses Checkout: Sistem memindahkan data keranjang ke tabel 'check_out', memperbarui saldo, dan mengurangi stok produk.
•	P3.6 Cetak Struk Transaksi: Sistem menghasilkan output struk berisi detail transaksi yang dapat dicetak atau disimpan dalam format digital.

5.3 Diagram OOP (Object Oriented Programming)
Sistem ini dibangun dengan paradigma berorientasi objek yang terdiri dari beberapa kelas utama. Objek User dan AuthController berfungsi sebagai pengendali keamanan dan autentikasi akses. Di sisi operasional, objek Product mengelola data inventaris, sementara Keranjang, CheckOut, dan History saling berinteraksi di bawah kendali TransactionController.
5.3.1 Struktur Hierarki Class
Berikut adalah struktur hierarki kelas yang digunakan dalam sistem:
Tabel 5.3 Deskripsi Kelas pada Sistem
No	Nama Kelas	Atribut Utama	Metode Utama	Deskripsi
1	User	id, name, username, password, role, email, saldo	login(), logout(), register()	Mengelola data pengguna sistem
2	AuthController	-	authenticate(), validateToken()	Mengontrol proses autentikasi
3	Product	id, name_product, des, harga, kategori, size, gambar, stok	add(), update(), delete(), search()	Mengelola data produk
4	Keranjang	id, id_product, id_akun, jumlah	addItem(), updateItem(), deleteItem()	Mengelola item dalam keranjang
5	CheckOut	id, id_product, id_akun, jumlah	processCheckout(), validateStock()	Memproses finalisasi transaksi
6	History	id, id_product, id_user, jumlah, tanggal	getHistory(), filterByDate()	Menyimpan dan menampilkan riwayat transaksi
7	TransactionController	-	createTransaction(), getReport()	Mengontrol alur transaksi

5.3.2 Relasi Antar Class
Relasi antar kelas dalam sistem ini dapat digambarkan melalui diagram kelas (Class Diagram) sebagai berikut:

Gambar 5.4 Diagram Kelas (Class Diagram) Sistem
 
Sumber: Hasil analisis dan perancangan penulis (2026)
Keterangan Relasi:
1.	User memiliki relasi One-to-Many dengan Keranjang: Satu pengguna dapat memiliki banyak item dalam keranjang.
2.	User memiliki relasi One-to-Many dengan CheckOut: Satu pengguna dapat melakukan banyak transaksi checkout.
3.	User memiliki relasi One-to-Many dengan History: Satu pengguna dapat memiliki banyak riwayat transaksi.
4.	Product memiliki relasi One-to-Many dengan Keranjang: Satu produk dapat muncul di banyak item keranjang.
5.	Product memiliki relasi One-to-Many dengan CheckOut: Satu produk dapat muncul di banyak transaksi checkout.
6.	Product memiliki relasi One-to-Many dengan History: Satu produk dapat muncul di banyak riwayat transaksi.
7.	CheckOut memiliki relasi One-to-One dengan History: Setiap transaksi checkout akan menghasilkan satu record history.

BAB VI
METODE PENGENDALIAN STOK

6.1 Reorder Point (ROP)
Reorder Point (ROP) atau titik pemesanan kembali merupakan salah satu metode pengendalian persediaan yang sangat penting dalam manajemen operasional. ROP adalah tingkat persediaan di mana perusahaan harus melakukan pemesanan ulang untuk menghindari terjadinya kekurangan stok (stockout) yang dapat mengganggu kelancaran operasional dan menyebabkan hilangnya potensi penjualan.
Konsep ROP didasarkan pada asumsi bahwa terdapat waktu tunggu (lead time) antara saat pemesanan dilakukan hingga barang tiba di gudang. Selama periode lead time tersebut, perusahaan masih harus melayani permintaan pelanggan. Oleh karena itu, ROP harus ditetapkan pada tingkat yang cukup untuk menutupi permintaan selama lead time ditambah dengan persediaan pengaman (safety stock) untuk mengantisipasi ketidakpastian.
Secara matematis, ROP dapat dirumuskan sebagai berikut:
ROP = (d × L) + SS
di mana:
•	d = tingkat permintaan rata-rata per periode (misalnya per hari atau per minggu)
•	L = lead time (waktu tunggu) dalam periode yang sama
•	SS = safety stock (persediaan pengaman)
6.1.1 Penerapan ROP pada Sistem Informasi Penjualan UMKM
Dalam konteks sistem informasi penjualan UMKM yang dikembangkan, perhitungan ROP dapat diimplementasikan secara otomatis untuk membantu pemilik usaha dalam menentukan kapan harus melakukan pemesanan ulang barang. Sistem akan menghitung ROP berdasarkan data historis penjualan dan parameter yang telah ditentukan.
Langkah-langkah penerapan ROP dalam sistem adalah sebagai berikut:
1.	Menghitung Rata-rata Permintaan Harian (d): Sistem menghitung rata-rata jumlah produk yang terjual per hari berdasarkan data penjualan historis selama periode tertentu (misalnya 30 hari terakhir).
2.	Menentukan Lead Time (L): Pemilik usaha menginputkan waktu yang dibutuhkan oleh supplier untuk mengirimkan barang setelah pemesanan dilakukan.
3.	Menghitung Safety Stock (SS): Sistem menghitung persediaan pengaman berdasarkan fluktuasi permintaan dan tingkat pelayanan yang diinginkan.
4.	Menghitung ROP: Sistem menghitung titik pemesanan ulang menggunakan formula ROP = (d × L) + SS.
5.	Memberikan Notifikasi: Ketika stok produk mencapai atau berada di bawah ROP, sistem akan secara otomatis memberikan notifikasi kepada pemilik usaha untuk segera melakukan pemesanan ulang.
6.1.2 Contoh Perhitungan ROP
Misalkan sebuah UMKM menjual produk A dengan data sebagai berikut:
•	Rata-rata permintaan harian (d) = 10 unit
•	Lead time (L) = 5 hari
•	Safety stock (SS) = 20 unit
Maka ROP = (10 × 5) + 20 = 50 + 20 = 70 unit
Artinya, ketika stok produk A tersisa 70 unit, pemilik usaha harus segera melakukan pemesanan ulang kepada supplier. Dengan demikian, selama proses pemesanan dan pengiriman barang (5 hari), stok yang tersisa (70 unit) cukup untuk memenuhi permintaan pelanggan (10 unit/hari × 5 hari = 50 unit) ditambah dengan persediaan pengaman (20 unit) untuk mengantisipasi lonjakan permintaan atau keterlambatan pengiriman.
6.2 Safety Stock (SS)
Safety stock atau persediaan pengaman adalah jumlah persediaan tambahan yang disimpan oleh perusahaan untuk meminimalkan risiko terjadinya kekurangan persediaan akibat ketidakpastian dalam permintaan dan waktu tunggu pengiriman. Konsep ini sangat penting dalam manajemen persediaan karena membantu perusahaan menjaga kontinuitas operasional dan kepuasan pelanggan.
6.2.1 Perhitungan Safety Stock
Perhitungan safety stock dapat dilakukan dengan berbagai pendekatan, tergantung pada ketersediaan data dan tingkat akurasi yang diinginkan. Salah satu metode yang umum digunakan adalah dengan mempertimbangkan standar deviasi permintaan dan lead time.
Secara matematis, safety stock dapat dihitung dengan formula:
SS = Z × σ<sub>d</sub> × √L
di mana:
•	Z = Faktor keamanan (nilai Z berdasarkan tingkat pelayanan yang diinginkan)
•	σ<sub>d</sub> = Standar deviasi permintaan harian
•	L = Lead time (waktu tunggu) dalam hari
Nilai Z untuk berbagai tingkat pelayanan (service level):
Service Level	Nilai Z
90%	1.28
95%	1.65
97%	1.88
99%	2.33

6.2.2 Faktor yang Memengaruhi Safety Stock
Seperti yang telah dijelaskan pada Bab II, besar kecilnya jumlah persediaan pengaman yang harus disediakan dipengaruhi oleh beberapa faktor utama:
1.	Fluktuasi Permintaan (Demand Variability): Semakin tinggi variabilitas permintaan, semakin besar safety stock yang dibutuhkan.
2.	Waktu Tunggu (Lead Time Variability): Semakin lama dan tidak pasti lead time, semakin besar safety stock yang diperlukan.
3.	Tingkat Pelayanan (Service Level): Semakin tinggi target service level, semakin besar safety stock yang harus disimpan.
6.2.3 Penerapan Safety Stock pada Sistem Informasi Penjualan UMKM
Dalam sistem informasi penjualan UMKM yang dikembangkan, fitur safety stock diimplementasikan untuk membantu pemilik usaha dalam mengelola persediaan secara lebih efektif. Sistem akan secara otomatis:
1.	Menghitung Safety Stock: Berdasarkan data historis penjualan dan parameter yang ditentukan.
2.	Memberikan Peringatan Dini: Ketika stok mendekati batas safety stock, sistem akan menampilkan peringatan.
3.	Merekomendasikan Jumlah Pemesanan: Sistem dapat memberikan rekomendasi jumlah pemesanan yang optimal berdasarkan perhitungan safety stock dan ROP.
6.2.4 Contoh Perhitungan Safety Stock
Berikut adalah contoh perhitungan safety stock untuk produk A:
Data:
•	Standar deviasi permintaan harian (σ<sub>d</sub>) = 5 unit
•	Lead time (L) = 5 hari
•	Target service level = 95% (Z = 1.65)
Perhitungan:
SS = Z × σ<sub>d</sub> × √L
SS = 1.65 × 5 × √5
SS = 1.65 × 5 × 2.236
SS = 18.45 ≈ 19 unit
Dengan demikian, safety stock yang harus disimpan untuk produk A adalah sekitar 19 unit. Ini berarti bahwa selain stok yang digunakan untuk memenuhi permintaan rata-rata selama lead time, UMKM harus menyimpan tambahan 19 unit sebagai persediaan pengaman.
Tabel 6.1 Contoh Perhitungan Safety Stock
Produk	σ<sub>d</sub> (unit)	L (hari)	Service Level	Z	SS (unit)
A	5	5	95%	1.65	19
B	3	3	90%	1.28	7
C	8	7	97%	1.88	40

6.2.5 Kurva Hubungan Safety Stock dengan Service Level
Hubungan antara safety stock dan service level bersifat non-linear. Semakin tinggi service level yang diinginkan, semakin besar peningkatan safety stock yang dibutuhkan. Hal ini karena pada tingkat pelayanan yang tinggi, setiap peningkatan kecil dalam service level memerlukan penambahan safety stock yang signifikan.




Gambar 6.1 Kurva Hubungan Safety Stock dengan Service Level
 
Sumber: Hasil perhitungan penulis berdasarkan rumus SS = Z × σd × √L (Tabel 6.1)
Kurva di atas menunjukkan bahwa untuk meningkatkan service level dari 90% menjadi 95%, diperlukan penambahan safety stock yang relatif kecil. Namun, untuk meningkatkan service level dari 97% menjadi 99%, diperlukan penambahan safety stock yang jauh lebih besar. Oleh karena itu, pemilik usaha harus mempertimbangkan secara cermat antara biaya penyimpanan persediaan tambahan dengan manfaat peningkatan service level.





BAB VII
DESAIN SISTEM

7.1 Desain Input dan Output
Desain input dan output merupakan komponen penting dalam sistem informasi penjualan UMKM berbasis web karena berperan langsung dalam proses pengolahan data menjadi informasi yang bermanfaat. Desain input difokuskan pada kemudahan pengguna dalam memasukkan data, seperti penggunaan form yang sederhana, validasi data, serta tampilan yang jelas agar meminimalkan kesalahan pengisian. Dengan input yang baik, kualitas data yang masuk ke dalam sistem dapat terjaga.
Sementara itu, desain output bertujuan untuk menyajikan informasi secara jelas, terstruktur, dan mudah dipahami oleh pengguna. Output dapat berupa laporan penjualan, data stok, maupun riwayat transaksi yang ditampilkan dalam bentuk tabel atau ringkasan.
7.1.1 Desain Input
Input sistem mencakup seluruh data yang dimasukkan melalui antarmuka aplikasi. Setiap form input dilengkapi dengan mekanisme validasi untuk mencegah kesalahan pengisian data. Validasi yang diterapkan meliputi pengecekan field wajib, pembatasan format angka pada field harga dan stok, serta notifikasi kesalahan secara langsung (real-time) kepada pengguna.
Tabel 7.1 Rancangan Desain Input Sistem
No	Nama Form	Field Input	Validasi
1	Form Login	Username, Password	Wajib diisi, password min. 8 karakter
2	Form Produk	Nama Produk, Harga, Stok, Kategori	Harga & stok berformat angka, field wajib diisi
3	Form Transaksi	ID Pelanggan, Produk, Jumlah, Tanggal	Stok tersedia, tanggal format DD/MM/YYYY
4	Form Pengguna	Username, Password, Role	Role dipilih dari daftar, username unik

7.1.2 Desain Output
Output sistem berupa informasi yang dihasilkan setelah proses pengolahan data. Informasi ditampilkan dalam bentuk tabel terstruktur yang mudah dipahami. Selain itu, sistem menyediakan fitur pencarian dan penyaringan (filter) berdasarkan periode waktu atau kategori tertentu untuk mempermudah pengguna dalam mengakses informasi yang dibutuhkan.
Tabel 7.2 Rancangan Desain Output Sistem
No	Jenis Output	Keterangan
1	Laporan Transaksi	Menampilkan riwayat penjualan harian, mingguan, atau bulanan dalam bentuk tabel
2	Data Stok Produk	Menampilkan jumlah stok terkini beserta status ketersediaan produk
3	Ringkasan Penjualan	Menampilkan total pendapatan dan jumlah transaksi dalam periode tertentu
4	Riwayat Aktivitas	Mencatat log aktivitas pengguna sebagai bahan audit sistem

7.2 Desain Antarmuka Pengguna (UI)
Desain antarmuka pengguna dirancang dengan mengutamakan kemudahan penggunaan (user friendly), tampilan yang bersih dan konsisten, serta responsivitas terhadap berbagai ukuran layar. Sistem memanfaatkan framework CSS Tailwind CSS untuk menghasilkan tampilan yang modern dan terstruktur. Pendekatan desain ini memastikan pengguna dapat berinteraksi dengan sistem secara intuitif, baik melalui perangkat desktop maupun mobile.
7.2.1 Struktur Halaman Utama
Antarmuka sistem terdiri dari beberapa halaman utama yang saling terhubung melalui navigasi yang jelas. Setiap halaman dirancang dengan tata letak yang konsisten agar pengguna dapat berpindah antar fitur dengan mudah. Elemen visual seperti tombol, ikon, dan penggunaan warna juga diperhatikan untuk meningkatkan pengalaman pengguna secara keseluruhan.
Tabel 7.3 Struktur Halaman Antarmuka Pengguna
No	Halaman	Fungsi Utama
1	Halaman Login	Autentikasi pengguna sebelum mengakses sistem
2	Dashboard	Menampilkan ringkasan data penjualan dan notifikasi stok
3	Manajemen Produk	Tambah, ubah, hapus, dan cari data produk
4	Transaksi Penjualan	Pencatatan transaksi baru dan riwayat transaksi
5	Laporan	Ekspor dan filter laporan berdasarkan periode waktu

7.2.2 Prinsip Desain Antarmuka
Dalam merancang antarmuka, beberapa prinsip desain diterapkan untuk memastikan kualitas pengalaman pengguna:
•	Konsistensi: Penggunaan warna, tipografi, dan tata letak yang seragam di seluruh halaman.
•	Kemudahan navigasi: Menu navigasi dirancang agar pengguna dapat mengakses fitur utama dalam maksimal dua langkah klik.
•	Responsivitas: Tampilan menyesuaikan ukuran layar secara otomatis menggunakan grid system dari Tailwind CSS.
•	Feedback visual: Setiap aksi pengguna (seperti menyimpan data atau menghapus item) disertai dengan notifikasi atau animasi yang memberikan umpan balik jelas.
•	Hierarki visual: Informasi disusun berdasarkan tingkat kepentingan, dengan elemen penting ditonjolkan menggunakan ukuran font, warna, atau posisi yang strategis.

7.3 Arsitektur Sistem
7.3.1 Komponen Arsitektur MVC
Sistem ini mengimplementasikan pola arsitektur Model-View-Controller (MVC) untuk memisahkan logika bisnis, data, dan tampilan antarmuka. Pemisahan ini bertujuan agar kode program lebih terstruktur dan mudah dikelola.
Tabel 7.4 Komponen Arsitektur MVC dan Teknologi yang Digunakan
Komponen	Teknologi	Peran dalam Sistem
Model	Node.js + PostgreSQL	Mengelola logika bisnis, validasi data, dan interaksi dengan basis data
View	React.js + Tailwind CSS	Membangun antarmuka dinamis dan responsif yang ditampilkan kepada pengguna
Controller	Express.js	Menangani permintaan HTTP, memproses logika routing, dan menghubungkan Model ke View

7.3.2 Alur Komunikasi Sistem
Komunikasi antara sisi client dan server dilakukan melalui HTTP request menggunakan format pertukaran data JSON (JavaScript Object Notation). Alur kerja sistem secara umum adalah sebagai berikut:
1.	Pengguna berinteraksi dengan antarmuka React.js (View).
2.	Permintaan dikirim ke Express.js (Controller) melalui REST API.
3.	Controller memproses logika dan berkomunikasi dengan Model untuk mengambil atau menyimpan data ke basis data PostgreSQL.
4.	Respons dikembalikan ke View dalam format JSON untuk ditampilkan kepada pengguna.
7.3.3 Keamanan Sistem
Aspek keamanan menjadi prioritas dalam pengembangan sistem informasi penjualan ini. Beberapa mekanisme perlindungan yang diterapkan meliputi:
•	Autentikasi dan Otorisasi: Penggunaan JSON Web Token (JWT) untuk memastikan identitas pengguna. Diterapkan Role-based Access Control (RBAC) untuk membatasi akses fitur antara Admin dan Kasir.
•	Keamanan Data: Kata sandi pengguna disimpan menggunakan algoritma hashing bcrypt sehingga tidak dapat dibaca secara langsung. Sistem menerapkan Prepared Statements untuk mencegah serangan SQL Injection.
•	Perlindungan Aplikasi: Validasi ketat pada setiap proses unggah file, baik dari segi ukuran maupun format dokumen.
•	Transmisi Data: Implementasi sertifikat SSL (HTTPS) pada server untuk memastikan seluruh pertukaran data antara pengguna dan server terenkripsi dengan aman.
7.4 Rancangan Basis Data
Sistem ini menggunakan PostgreSQL sebagai Relational Database Management System (RDBMS) karena performanya yang stabil dan kemampuannya mengelola data terstruktur secara efisien. PostgreSQL dipilih karena mendukung fitur relasi antar tabel dan keamanan data yang baik, sehingga sangat relevan untuk kebutuhan sistem informasi penjualan berbasis web.
Perancangan basis data dilakukan melalui Entity Relationship Diagram (ERD) untuk memvisualisasikan hubungan antar entitas, seperti pengguna, produk, dan transaksi. Dalam implementasinya, konsistensi data dijaga melalui penggunaan primary key dan foreign key.
7.4.1 Tabel User
Tabel 'user' berfungsi sebagai tabel master pengguna sistem. Tabel ini menyimpan data akun semua pengguna yang dapat mengakses sistem, baik Administrator maupun Kasir/Operator.





Tabel 7.5 Struktur Tabel User
Field	Tipe Data	Panjang	Constraint	Keterangan
id	INT	11	PRIMARY KEY, AUTO_INCREMENT, NOT NULL	Identitas unik pengguna
name	VARCHAR	100	NOT NULL	Nama lengkap pengguna
username	VARCHAR	50	NOT NULL, UNIQUE	Nama pengguna untuk login
password	VARCHAR	255	NOT NULL	Password terenkripsi (bcrypt)
role	ENUM('admin','kasir')	-	NOT NULL, DEFAULT 'kasir'	Peran/hak akses pengguna
saldo	DECIMAL(15,2)	-	DEFAULT 0	Saldo akun pengguna
email	VARCHAR	100	NOT NULL, UNIQUE	Alamat email pengguna

7.4.2 Tabel Product
Tabel 'product' merupakan tabel master produk yang menyimpan seluruh informasi barang yang dijual oleh UMKM.
Tabel 7.6 Struktur Tabel Product
Field	Tipe Data	Panjang	Constraint	Keterangan
id	INT	11	PRIMARY KEY, AUTO_INCREMENT, NOT NULL	Identitas unik produk
name_product	VARCHAR	150	NOT NULL	Nama produk
des	TEXT	-	NULLABLE	Deskripsi lengkap produk
harga	DECIMAL(12,2)	-	NOT NULL	Harga jual produk (Rupiah)
kategori	VARCHAR	100	NOT NULL	Kategori produk
size	VARCHAR	50	NULLABLE	Ukuran produk
gambar	VARCHAR	255	NULLABLE	Path/URL gambar produk
stok	INT	11	NOT NULL, DEFAULT 0	Jumlah stok produk yang tersedia

7.4.3 Tabel Keranjang
Tabel 'keranjang' berfungsi sebagai penyimpanan sementara (temporary storage) item yang telah dipilih oleh kasir sebelum proses checkout dilakukan.
Tabel 7.7 Struktur Tabel Keranjang
Field	Tipe Data	Panjang	Constraint	Keterangan
id	INT	11	PRIMARY KEY, AUTO_INCREMENT, NOT NULL	Identitas unik item keranjang
id_product	INT	11	NOT NULL, FOREIGN KEY (product.id)	Referensi ke ID produk yang dipilih
id_akun	INT	11	NOT NULL, FOREIGN KEY (user.id)	Referensi ke ID pengguna yang menambahkan item
jumlah	INT	11	NOT NULL, DEFAULT 1	Jumlah item produk yang dipilih

7.4.4 Tabel Check_Out
Tabel 'check_out' menyimpan data transaksi yang telah selesai diproses melalui mekanisme checkout.
Tabel 7.8 Struktur Tabel Check_Out
Field	Tipe Data	Panjang	Constraint	Keterangan
id	INT	11	PRIMARY KEY, AUTO_INCREMENT, NOT NULL	Identitas unik record checkout
jumlah	INT	11	NOT NULL	Jumlah item produk yang dibeli
id_product	INT	11	NOT NULL, FOREIGN KEY (product.id)	Referensi ke ID produk yang dibeli
id_akun	INT	11	NOT NULL, FOREIGN KEY (user.id)	Referensi ke ID pengguna yang melakukan checkout

7.4.5 Tabel History
Tabel 'history' berfungsi sebagai rekam jejak (log) dari seluruh transaksi penjualan yang pernah terjadi dalam sistem.
Tabel 7.9 Struktur Tabel History
Field	Tipe Data	Panjang	Constraint	Keterangan
id	INT	11	PRIMARY KEY, AUTO_INCREMENT, NOT NULL	Identitas unik record history
jumlah	INT	11	NOT NULL	Jumlah produk yang terjual dalam transaksi ini
id_product	INT	11	NOT NULL, FOREIGN KEY (product.id)	Referensi ke ID produk yang terjual
id_user	INT	11	NOT NULL, FOREIGN KEY (user.id)	Referensi ke ID pengguna yang melakukan transaksi

7.5 Alur Program POS (Flowchart)
Flowchart sistem adalah representasi grafis dari alur kerja atau proses yang terjadi di dalam sebuah sistem, menggunakan simbol-simbol standar untuk menggambarkan setiap langkah proses, keputusan, dan aliran data. Pembuatan flowchart merupakan implementasi langsung dari mata kuliah Analisis dan Perancangan Sistem Informasi.
Dalam sistem informasi penjualan UMKM ini, flowchart menggambarkan alur kerja lengkap mulai dari proses login pengguna hingga logout. 
 

 
Sumber: Hasil analisis dan perancangan penulis (2026)



Keterangan Alur:
1.	Mulai: Pengguna membuka aplikasi web.
2.	Halaman Login: Pengguna memasukkan username dan password.
3.	Validasi Kredensial: Sistem memverifikasi data login dengan basis data.
4.	Jika Gagal: Sistem menampilkan pesan error dan kembali ke halaman login.
5.	Jika Berhasil: Pengguna diarahkan ke halaman Dashboard utama.
6.	Pilih Operasi: Pengguna memilih salah satu dari tiga menu utama.
7.	Kelola Produk: Pengguna dapat menambah, mengedit, menghapus, atau mencari data produk.
8.	Transaksi Penjualan: Pengguna memilih produk, menambah ke keranjang, melakukan checkout, dan mencetak struk.
9.	Laporan Penjualan: Pengguna memilih periode waktu, menampilkan laporan, dan mengekspor ke PDF/Excel.
10.	Operasi Lain: Sistem menanyakan apakah pengguna ingin melakukan operasi lain.
11.	Jika Ya: Kembali ke Dashboard.
12.	Jika Tidak: Pengguna melakukan logout dan sistem berakhir.

DAFTAR PUSTAKA
Al Fatta, Hanif. 2007. Analisis dan Perancangan Sistem Informasi untuk Keunggulan Bersaing Perusahaan dan Organisasi Modern. Yogyakarta: Penerbit Andi.
Banks, Alex dan Eve Porcello. 2017. Learning React: Functional Web Development with React and Redux. Sebastopol: O'Reilly Media.
Cantelon, Mike, dkk. 2017. Node.js in Action, 2nd Edition. New York: Manning Publications.
Connolly, Thomas dan Carolyn Begg. 2015. Database Systems: A Practical Approach to Design, Implementation, and Management, 6th Edition. London: Pearson Education Limited.
Juran, J. M. 2003. Quality Control Handbook. New York: McGraw-Hill.
Kadir, Abdul. 2014. Pengenalan Sistem Informasi. Yogyakarta: Penerbit Andi.
Kementerian Koperasi dan Usaha Kecil dan Menengah Republik Indonesia. 2020. Perkembangan Data Usaha Mikro, Kecil, Menengah (UMKM) dan Usaha Besar (UB) Tahun 2018-2019. Jakarta: Kemenkop UKM.
Nugroho, Bunafit. 2013. Dasar Pemrograman Web PHP-MySQL dengan Dreamweaver. Yogyakarta: Gava Media.
Pressman, Roger S. dan Bruce R. Maxim. 2019. Software Engineering: A Practitioner's Approach, 9th Edition. New York: McGraw-Hill Education.
S., Rosa A. dan M. Shalahuddin. 2018. Rekayasa Perangkat Lunak Terstruktur dan Berorientasi Objek. Bandung: Informatika.
Sutabri, Tata. 2012. Analisis Sistem Informasi. Yogyakarta: Penerbit Andi.
Undang-Undang Republik Indonesia Nomor 20 Tahun 2008 tentang Usaha Mikro, Kecil, dan Menengah. Jakarta: Sekretariat Negara.
Welling, Luke dan Laura Thomson. 2016. PHP and MySQL Web Development, 5th Edition. Boston: Addison-Wesley Professional.
