import Image from "next/image";
import { useLanguage } from "../lib/language";

const photos = [
  { alt: "IndiGo crew member working inside an aircraft cabin", file: "01", height: 619, width: 495 },
  { alt: "IndiGo employees beside the airline's blue aircraft livery", file: "02", height: 480, width: 640 },
  { alt: "IndiGo team members gathered at the airport", file: "03", height: 1000, width: 800 },
  { alt: "Cabin crew standing together beside an IndiGo aircraft", file: "04", height: 393, width: 588 },
  { alt: "IndiGo aircraft flying at sunset", file: "05", height: 480, width: 719 },
  { alt: "Passengers at an IndiGo airport check-in counter", file: "06", height: 402, width: 715 },
  { alt: "IndiGo hiring announcement featuring airline crew", file: "07", height: 500, width: 1000 },
  { alt: "IndiGo aviation display at an airport event", file: "08", height: 540, width: 960 },
  { alt: "IndiGo team celebrating at an airport event", file: "09", height: 554, width: 554 },
  { alt: "IndiGo flight crew at the airport", file: "10", height: 554, width: 554 },
  { alt: "Airport security staff in uniform", file: "11", height: 619, width: 495 },
  { alt: "IndiGo colleagues gathered at the airport", file: "12", height: 415, width: 739 },
  { alt: "Airline colleagues posing together in uniform", file: "13", height: 616, width: 497 },
  { alt: "IndiGo hiring announcement with crew members", file: "14", height: 619, width: 495 },
  { alt: "Cabin crew member working inside an aircraft", file: "15", height: 638, width: 479 },
  { alt: "Illustrated aviation careers and airline roles", file: "16", height: 195, width: 257 },
  { alt: "IndiGo cabin crew gathered inside an aircraft", file: "17", height: 554, width: 554 },
  { alt: "IndiGo crew standing together in uniform", file: "18", height: 399, width: 769 },
  { alt: "IndiGo team posing together outdoors", file: "19", height: 401, width: 764 },
  { alt: "IndiGo colleagues celebrating together", file: "20", height: 408, width: 588 },
  { alt: "IndiGo cabin crew member in uniform", file: "21", height: 619, width: 495 },
  { alt: "IndiGo aircraft in a sunset aviation scene", file: "22", height: 554, width: 554 },
  { alt: "IndiGo aircraft on the airport apron", file: "23", height: 407, width: 720 },
  { alt: "GoIndiGo branded aviation illustration", file: "24", height: 427, width: 547 },
  { alt: "IndiGo aircraft at sunset", file: "25", height: 387, width: 516 },
  { alt: "IndiGo aircraft tail against the evening sky", file: "26", height: 477, width: 886 },
  { alt: "IndiGo airline logo", file: "27", height: 452, width: 678 },
];

export default function IndigoGallery() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="indigo-gallery-title" className="section indigo-gallery-section">
      <div className="section-inner">
        <h2 id="indigo-gallery-title">{t.indigoGalleryTitle}</h2>
        <p className="section-text">{t.indigoGalleryText}</p>
        <div className="indigo-gallery">
          {photos.map((photo) => (
            <figure className="indigo-gallery-item" key={photo.file}>
              <Image
                alt={photo.alt}
                height={photo.height}
                sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 25vw"
                src={`/images/indigo-careers/indigo-career-${photo.file}.jpeg`}
                width={photo.width}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
