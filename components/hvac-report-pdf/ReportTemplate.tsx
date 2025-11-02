import React from 'react';
import type { ReportData } from '@/lib/hvac-types';
import { SzutestLogo, TurkakLogo } from './icons';

const ReportTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  // Group test instances by type
  const testGroups = data.testInstances?.reduce((groups, instance) => {
    const key = instance.testType;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(instance);
    return groups;
  }, {} as Record<string, typeof data.testInstances>) || {};

  const getTestTitle = (testType: string) => {
    const titles: Record<string, string> = {
      'airflowData': 'Hava Debisi Testi',
      'pressureDifference': 'Basınç Farkı Testi', 
      'airFlowDirection': 'Hava Akış Yönü Testi',
      'hepaLeakage': 'HEPA Sızdırmazlık Testi',
      'particleCount': 'Partikül Sayısı Testi',
      'recoveryTime': 'Recovery Time Testi',
      'temperatureHumidity': 'Sıcaklık ve Nem Testi'
    };
    return titles[testType] || testType;
  };

  const renderTestTables = () => {
    return Object.entries(testGroups).map(([testType, instances]) => (
      <div key={testType} className="mb-8">
        <h3 className="font-bold text-lg mb-4 bg-gray-100 p-3 rounded-lg">
          {getTestTitle(testType)} ({instances.length} adet)
        </h3>
        <table className={`${tableClass} mb-4`}>
          <thead>
            <tr>
              <th className={`${thClass} w-1/12`}>No</th>
              <th className={`${thClass} w-3/12`}>Oda</th>
              <th className={`${thClass} w-3/12`}>Ölçüm Değeri</th>
              <th className={`${thClass} w-3/12`}>Kriter</th>
              <th className={`${thClass} w-2/12`}>Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance, index) => {
              let displayValue = '';
              switch(testType) {
                case 'hepaLeakage':
                  displayValue = `${instance.data?.actualLeakage || 0}%`;
                  break;
                case 'pressureDifference':
                  displayValue = `${instance.data?.pressure || 0} Pa`;
                  break;
                case 'airflowData':
                  displayValue = `${instance.data?.flowRate || 0} m³/h`;
                  break;
                case 'temperatureHumidity':
                  displayValue = `${instance.data?.temperature || 0}°C / ${instance.data?.humidity || 0}%`;
                  break;
                default:
                  displayValue = instance.data?.duration ? 
                    `${instance.data.duration}` : 'N/A';
              }

              return (
                <tr key={instance.id}>
                  <td className={tdCenterClass}>{index + 1}</td>
                  <td className={tdClass}>{instance.roomName}</td>
                  <td className={tdCenterClass}>{displayValue}</td>
                  <td className={tdCenterClass}>{instance.data?.criteria || ''}</td>
                  <td className={`${tdCenterClass} ${
                    instance.data?.meetsCriteria ? 
                    'text-green-600 font-semibold' : 
                    'text-red-600 font-semibold'
                  }`}>
                    {instance.data?.meetsCriteria ? 'UYGUN' : 'UYGUN DEĞİL'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="h-4"></div>
      </div>
    ));
  };
    // Shared classes
    const pageClass = "report-page-a4 p-8 flex flex-col font-sans text-xs";
    const footerText = "Bu rapor, laboratuvarın yazılı izni olmadan kısmen kopyalanıp çoğaltılamaz. İmzasız ve mühürsüz raporlar geçersizdir. This report shall not be reproduced other than in full except with the permission of the laboratory. Testing reports without signature and sealare not valid.";
    const footerId = "FR.L.İÇ.D.07 R:09";
    const tableClass = "w-full border-collapse border border-black";
    const thClass = "border border-black p-1 bg-gray-200 font-bold text-center";
    const tdClass = "border border-black p-1 bg-white";
    const tdCenterClass = `${tdClass} text-center`;

    const InfoRow = ({ label, value }: { label: string, value: string | number }) => (
        <div className="flex border-t border-l border-r border-black">
            <div className="w-2/5 p-1 border-r border-black font-semibold">{label}</div>
            <div className="w-3/5 p-1">: {value}</div>
        </div>
    );

    const PageHeader = () => (
        <div className="flex items-start justify-between pb-4 border-b-2 border-black text-[10px]">
            <div className="w-1/4">
                <SzutestLogo className="w-4/5 h-auto" />
            </div>
            <div className="w-1/2 text-center pt-2">
                <h2 className="font-bold text-base">SZUTEST DENEY LABORATUVARI</h2>
                <h3 className="font-bold text-sm">SZUTEST TEST LABORATORY</h3>
                <p className="mt-4 text-xs">Szutest Uygunluk Değerlendirme A.Ş.</p>
                <p>Yukarı Dudullu Mah. Nato Yolu Cad. Çam Sok. No:7 Ümraniye / İSTANBUL</p>
            </div>
            <div className="w-1/4 flex flex-col items-end">
                <div className="border-2 border-black p-1 w-24 h-24 flex flex-col justify-center items-center">
                    <div className="text-red-600 font-bold text-lg -tracking-widest">TÜRKAK</div>
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-red-600" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <div className="text-center border border-black px-2 mt-1">
                        <p className="font-semibold">Test</p>
                    </div>
                    <p className="text-[6px] font-semibold mt-1">TS EN ISO/IEC 17025</p>
                    <p className="text-[6px] font-semibold">AB-0920-T</p>
                </div>
                <table className="text-center text-[10px] border-collapse border-2 border-black mt-2 w-24">
                    <tbody>
                        <tr><td className="border-2 border-black p-1">{data.reportNo.split('-')[0]}-T</td></tr>
                        <tr><td className="border-2 border-black p-1">{data.reportNo}</td></tr>
                        <tr><td className="border-2 border-black p-1">12-21</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const SubsequentPageHeader = ({ pageNum }: { pageNum: number }) => (
        <div className="flex items-center justify-between pb-2 border-b-2 border-black h-20">
            <div className="w-1/4 flex items-center border-r-2 border-black h-full pr-2">
                <div className="w-2/3"><SzutestLogo className="w-full h-auto" /></div>
                <div className="w-1/3 text-center ml-2 border-l border-black pl-2">
                    <p className="text-[10px]">Sayfa {pageNum} / {data.totalPages}</p>
                    <p className="text-[10px]">Page{pageNum} / {data.totalPages}</p>
                </div>
            </div>
            <div className="w-1/2 text-center">
                <h2 className="font-bold text-base">SZUTEST DENEY LABORATUVARI</h2>
                <h3 className="font-bold text-sm">SZUTEST TEST LABORATORY</h3>
                <p className="mt-2 text-xs">SZUTEST Uygunluk Değerlendirme A.Ş.</p>
            </div>
            <div className="w-1/4 flex justify-end">
                <table className="text-center text-[10px] border-collapse border-2 border-black w-24">
                    <tbody>
                        <tr><td className="border-2 border-black p-1">{data.reportNo.split('-')[0]}-T</td></tr>
                        <tr><td className="border-2 border-black p-1">{data.reportNo}</td></tr>
                        <tr><td className="border-2 border-black p-1">12-21</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const PageFooter = () => (
        <div className="mt-auto pt-2 border-t-2 border-blue-600 text-[9px] flex justify-between items-center">
            <p className="w-3/4">{footerText}</p>
            <p className="w-1/4 text-right font-semibold">{footerId}</p>
        </div>
    );

    return (
        <>
            {/* Page 1 */}
            <div className={pageClass}>
                <PageHeader />
                <main className="flex-grow my-4">
                    <h1 className="text-center font-bold text-xl my-4">Deney Raporu <br /> Test Report</h1>
                    <p className="text-center font-bold text-red-600 text-md">HEPAVENT HVF KANAL/TAVAN<br />TİPİ HAVA TEMİZLEME ÜNİTELERİ</p>
                    <div className="mt-6 border-b border-black">
                        <div className="flex border-t border-l border-r border-black">
                            <div className="w-2/5 p-1 border-r border-black font-semibold">Müşteri adı / adresi<br />Customer name / adress</div>
                            <div className="w-3/5 p-1">: {data.customerName}<br/>: {data.customerAddress}</div>
                        </div>
                        <InfoRow label="İstek numarası Order no" value={data.orderNo} />
                        <InfoRow label="Bakanlık Yetki Numarası Ministry authorization no" value={data.ministryAuthNo} />
                        <InfoRow label="Numune adı ve tarifi *durumu Name and identity of test item" value={data.testItemName} />
                        <InfoRow label="Numune kabul tarihi The date of receipt of test item" value={data.receiptDate} />
                        <InfoRow label="Açıklamalar Remarks" value={data.remarks} />
                        <InfoRow label="Ölçüm tarihi The date of test" value={data.testDate} />
                        <InfoRow label="Rapor no Report no" value={data.reportNo} />
                        <InfoRow label="Rapor sayfa sayısı Number of pages of the Report" value={data.totalPages} />
                    </div>
                    <p className="text-[10px] mt-4">
                        Deney laboratuvarı olarak faaliyet gösteren SZUTEST Uygunluk Değerlendirme A.Ş. TÜRKAK'tan AB-0920-T dosya numarası ile TS EN ISO / IEC 17025:2017 standardına göre akredite edilmiştir.SZUTEST Uygunluk Değerlendirme A.Ş. accredited by TÜRKAK under registration number AB-0920-T for TS EN ISO / IEC 17025:2017 as test laboratory."
                    </p>
                    <p className="text-[10px] mt-2">
                        Türk Akreditasyon Kurumu(TÜRKAK) deney raporlarının tanınması konusunda Avrupa Akreditasyon Birliği(EA) ve Uluslararası Laboratuvar Akreditasyon Birliği(ILAC) ile karşılıklı tanınma antlaşmasını imzalamıştır. The Turkish Accreditation Acency (TURKAK) is signatory to the multilateral agreements of the European co-operation for the Accreditation (EA) and of the International Laboratory Accreditation (ILAC) for the Mutual recognation of test reports. Deney ve/veya ölçüm sonuçları, genişletilmiş ölçüm belirsizlikleri ( olması halinde) ve deney metotları bu sertifikanın tamamlayıcı kısmı olan takip eden sayfalarda verilmiştir. The test and/veya measurement results, the uncertainties (if applicable) with confidence probability and test methods are given on the following pages which are part of this report. Bu rapor, laboratuvarımıza ulaşan numunelere deney ve/veya deneyler uygulanarak elde edilmiştir. Müşteriye ait diğer numuneleri kapsamaz. This report was prepared after applying test/tests to the samples that are sent to our company. Note that this report does not involve other samples of the customer.
                    </p>
                    <div className="flex justify-around mt-8">
                        <div className="text-center">
                            <p className="font-semibold">Yayımlandığı Tarih<br />Date</p><p className="mt-4">{data.publishDate}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold">Deney Sorumlusu<br />Person in charge of test</p><p className="mt-4">{data.personInCharge}</p>
                        </div>
                        <div className="text-center">
                             <p className="font-semibold">Laboratuvar Müdürü<br />Head of test laboratory</p><p className="mt-4">{data.labManager}</p>
                        </div>
                    </div>
                </main>
                <PageFooter />
            </div>

            {/* Page 2 */}
            <div className={pageClass}>
                <SubsequentPageHeader pageNum={2} />
                <main className="flex-grow my-4 h-full flex items-center justify-center">
                    <div className="w-full h-full p-4 text-sm">
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1"><span>1. GİRİŞ</span><span>3</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 ml-8"><span>1.1 Ölçüm Bilgileri</span><span>3</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 mt-4"><span>2. ÖLÇÜM ANALİZ YÖNTEMİ ve KULLANILAN METOTLAR</span><span>3</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 ml-8"><span>2.1 Ölçüm Cihazları</span><span>3</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 ml-8"><span>2.4 Ölçümler Sırasında Alınan Çevre Şartları</span><span>4</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 ml-8"><span>2.5 Cihaz Doğrulamaları</span><span>4</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 mt-4"><span>3. ÖLÇÜM NOKTALARI</span><span>4</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 mt-4"><span>4. ÖLÇÜM SONUÇLARI</span><span>5</span></div>
                        <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 py-1 mt-4"><span>5. DEĞERLENDİRME</span><span>6</span></div>
                    </div>
                </main>
                <PageFooter />
            </div>

            {/* Page 3 */}
            <div className={pageClass}>
                <SubsequentPageHeader pageNum={3} />
                <main className="flex-grow my-4 space-y-4">
                    <div>
                        <h3 className="font-bold">1. GİRİŞ</h3>
                        <p className="mt-1">MORZON TEKNOLOJİ A.Ş isimli iş yerinin talebi doğrultusunda SZUTEST Deney Laboratuvarının yetkili deney personeli tarafından yapılan ön inceleme sonucu iş yerinde iç ortam gürültü ölçümleri yapılmış olup, inceleme ve ölçümler ile ilgili tüm sonuçlar ve öneriler bu raporda belirtilmiştir.</p>
                    </div>
                    <div>
                        <h3 className="font-bold">1.1 Ölçüm Bilgileri</h3>
                        <table className={`${tableClass} mt-1 text-[10px]`}>
                            <tbody>
                                <tr>
                                    <td className={`${tdClass} font-semibold w-1/4`}>Ölçüm Sayısı</td><td className={`${tdClass} w-1/4`}>{data.measurementCount}</td>
                                    <td className={`${tdClass} font-semibold w-1/4`}>Ölçüm Tarihi</td><td className={`${tdClass} w-1/4`}>{data.testDate}</td>
                                </tr>
                                <tr>
                                    <td className={`${tdClass} font-semibold`}>Ölçümün Alındığı Adres</td><td className={tdClass}>{data.measurementAddress}</td>
                                    <td className={`${tdClass} font-semibold`}>Rapor Numarası</td><td className={tdClass}>{data.reportNo}</td>
                                </tr>
                                <tr>
                                    <td className={`${tdClass} font-semibold`}>Ölçüm Metodu</td><td className={tdClass}>{data.measurementMethod}</td>
                                    <td className={`${tdClass} font-semibold`}>Ölçümü Gerçekleştiren</td><td className={tdClass}>{data.measurementExecutor}</td>
                                </tr>
                                <tr>
                                    <td className={`${tdClass} font-semibold`}>Ölçüm Türü</td><td className={tdClass}>{data.measurementType}</td>
                                    <td className={`${tdClass} font-semibold`}>Raporu Gözden Geçiren</td><td className={tdClass}>{data.reportReviewer}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-center font-bold mt-1 text-xs">Tablo1: Ölçüm Bilgileri</p>
                    </div>
                    <div>
                        <h3 className="font-bold">2. ÖLÇÜM ANALİZ YÖNTEMİ ve KULLANILAN METOTLAR, ÖLÇÜM TALİMATI</h3>
                        <p className="mt-1">Firma yetkilileri ile birlikte belirlenen ölçüm noktalarında yapılan ölçümler, 02.12.2021 tarihinde 09:00 - 18:00 saatleri arasında ve tipik çalışma koşullarında gerçekleştirilmiştir. İç ortam gürültü ölçümleri, yapılan ön inceleme sonucunda firmanın rutin çalışma koşullarına göre TS ISO 1996-2 standardına uygun olarak gerçekleştirilmiştir. Ölçümler Szutest Uygunluk Değerlendirme A.Ş Kalite Yönetim Sistemi TL.L.İÇ.A.08 ‘“İç Ortam Gürültü Ölçüm Talimatı” doğrultusunda gerçekleştirilmiştir.</p>
                    </div>
                    <div>
                        <h3 className="font-bold">2.1 Ölçüm Cihazları</h3>
                        <p className="mt-1">Ölçümlerde kullanılan cihazlara ait bilgiler aşağıdaki tabloda ve cihazlara ait kalibrasyon belgeleri raporun arkasında verilmiştir.</p>
                        <table className={`${tableClass} mt-1`}>
                            <thead>
                                <tr><th className={thClass}>Cihaz Adı</th><th className={thClass}>Marka</th><th className={thClass}>Model</th><th className={thClass}>Seri Numarası</th></tr>
                            </thead>
                            <tbody>
                                {data.devices.map(d => (<tr key={d.id}><td className={tdClass}>{d.name}</td><td className={tdClass}>{d.brand}</td><td className={tdCenterClass}>{d.model}</td><td className={tdCenterClass}>{d.serial}</td></tr>))}
                            </tbody>
                        </table>
                        <p className="text-center font-bold mt-1 text-xs">Tablo2: Cihaz Bilgileri</p>
                    </div>
                </main>
                <PageFooter />
            </div>

            {/* Page 4 */}
            <div className={pageClass}>
                <SubsequentPageHeader pageNum={4} />
                <main className="flex-grow my-4 space-y-4">
                    <div>
                        <h3 className="font-bold">2.4 Ölçümler Sırasında Alınan Çevre Şartları</h3>
                        <p className="mt-1">02.12.2021 tarihinde MORZON TEKNOLOJİ A.Ş gerçekleştirilen iç ortam gürültü ölçümleri sırasında alınan çevre şartları aşağıda belirtilmiştir.</p>
                        <table className={`${tableClass} mt-1 w-1/2`}>
                            <tbody>
                                <tr><td className={`${tdClass} font-semibold`}>Sıcaklık</td><td className={tdCenterClass}>{data.envConditions.temperature}</td></tr>
                                <tr><td className={`${tdClass} font-semibold`}>Bağıl Nem</td><td className={tdCenterClass}>{data.envConditions.humidity}</td></tr>
                                <tr><td className={`${tdClass} font-semibold`}>Ortam Basıncı</td><td className={tdCenterClass}>{data.envConditions.pressure}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3 className="font-bold">2.5 Cihaz Doğrulamaları</h3>
                        <p className="mt-1">Ölçümlere başlamadan öncesinde ve ölçümler tamamlandıktan sonra cihazların doğrulaması Tip-1 akustik kalibratörü ile yapılmakta olup bulunan sonuçlar aşağıdaki tabloda verilmiştir.</p>
                        <table className={`${tableClass} mt-1`}>
                            <thead>
                                <tr><th className={thClass}>Cihaz Adı</th><th className={thClass}>Seri Numarası</th><th className={thClass}>Referans Değer (dB)</th><th className={thClass}>Ölçümden Önce (dB)</th><th className={thClass}>Ölçümden Sonra (dB)</th></tr>
                            </thead>
                            <tbody>
                                {data.calibrations.map(c => (<tr key={c.id}><td className={tdClass}>{c.deviceName}</td><td className={tdCenterClass}>{c.serial}</td><td className={tdCenterClass}>{c.refValue}</td><td className={tdCenterClass}>{c.beforeValue}</td><td className={tdCenterClass}>{c.afterValue}</td></tr>))}
                            </tbody>
                        </table>
                        <p className="text-center font-bold mt-1 text-xs">Tablo3: Cihaz doğrulama kayıtları</p>
                    </div>
                    <div>
                        <h3 className="font-bold">3. ÖLÇÜM NOKTALARI</h3>
                        <p className="mt-1">Ölçüm yapılan bölüm ve/veya işçi hakkındaki bilgiler aşağıdaki tabloda verilmiştir.</p>
                        <table className={`${tableClass} mt-1`}>
                            <thead>
                                <tr><th className={thClass}>No</th><th className={thClass}>Ölçüm Yapılan Bölüm</th><th className={thClass}>Ölçüm Yapılan İşçi</th></tr>
                            </thead>
                            <tbody>
                                {data.measurementPoints.map((p, i) => (<tr key={p.id}><td className={tdCenterClass}>{i + 1}</td><td className={tdClass}>{p.location}</td><td className={tdCenterClass}>{p.personnel}</td></tr>))}
                            </tbody>
                        </table>
                    </div>
                </main>
                <PageFooter />
            </div>

            {/* Page 5 - Test Results */}
            <div className={pageClass}>
                <SubsequentPageHeader pageNum={5} />
                <main className="flex-grow my-4">
                    <h3 className="font-bold text-xl mb-8 text-center">TEST SONUÇLARI</h3>
                    {(data.testInstances?.length ?? 0) > 0 ? (
                        renderTestTables()
                    ) : (
                        <p className="text-center text-gray-500">Test sonucu bulunamadı</p>
                    )}
                </main>
                <PageFooter />
            </div>

            {/* Page 6 - Evaluation */}
            <div className={pageClass}>
                <SubsequentPageHeader pageNum={6} />
                <main className="flex-grow my-4 space-y-4">
                    <div>
                        <h3 className="font-bold">5. DEĞERLENDİRME</h3>
                        <p className="mt-1 text-justify">4. bölümde belirtilen ölçüm sonuçlarındaki değerler, raporda belirtilen ölçüm tarihindeki çevre şartlarında yapılan ölçümlerin sonuçlarını göstermekte olup değerlendirmeler bu sonuçlar baz alınarak yapılmalıdır. İç Ortam Gürültü ölçümleri için verilmiş bir sınır değer olmasa da risk değerlendirmesine tabi tutulması tavsiye olunur.</p>
                        <p className="mt-2 text-justify">SZUTEST Uygunluk Değerlendirme A.Ş. olarak deney raporlarında belirlenmiş bir gerekliliğe göre deney yapıldığında ve müşteri veya gereklilik bir uygunluk bildirimini zorunlu kıldığında deney sonuçlarının bu belirlenmiş gerekliliğe uygunluk gösterip göstermediğini belirten bir açıklamaya deney raporunda yer verilir. Müşteri deney için bir şartnameye veya standarda uygunluk beyanı talep ettiğinde laboratuvar deney raporunda uygunluk beyanını PR.L.İÇ.01 Karar Kuralı Prosedürüne göre uygular. Müşteri, teklif aşamasında Karar Kuralı ile ilgili bilgilendirilir.</p>
                        <p className="mt-2 text-justify">Laboratuvar müşteri ile anlaşma/sözleşme aşamasında müşteri lehine olan 'yanlış ret' karar kuralını uygular. Müşteri talebi ile müşteri aleyhine 'yanlış kabul karar kuralı da uygulanabilmektedir. Karar kuralı uygulanan sonuç # ile işaretlenir ve deney raporunda ' # ile işaretlenen sonuca %95 güven aralığında ölçüm belirsizliği eklenerek/çıkarılarak yanlış ret kuralı uygulanmıştır. İfadesi eklenir.</p>
                        <p className="mt-2 text-justify">Laboratuvar, yetkili personeli tarafından alınmayan ve/veya uygun koşullarda gelmeyen numunelerden, müşteri tarafından temin edilen bilgilerin deney sonuçlarının geçerliliğini etkilemesi durumunda teknik ve hukuki olarak sorumluluk kabul etmemektedir.</p>
                        <p className="mt-4 font-bold">İÇ2112-42İH Numaralı rapor müşteri talebine istinaden 3. ve 4. noktaları ayrı bir rapor olarak raporlanması ve yazım hatası sebebiyle revize edilmiş olup, yerine İÇ2112-42İH-1 numaralı rapor geçmiştir. İÇ2112-42İH numaralı rapor geçersizdir.</p>
                    </div>
                    <div className="flex-grow flex flex-col justify-end items-end h-full">
                        <div className="text-center mt-16">
                            <p className="font-semibold">Raporu Hazırlayan</p>
                            <p className="font-semibold">Prepaired by</p>
                            <p className="mt-8">{data.preparedBy}</p>
                        </div>
                    </div>
                </main>
                <PageFooter />
            </div>
        </>
    );
};

export default ReportTemplate;
