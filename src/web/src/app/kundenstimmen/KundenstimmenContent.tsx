'use client';

import { useState, useEffect, useCallback } from 'react';

const PREVIEW_LENGTH = 400;

interface Testimonial {
  name: string;
  role: string | null;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Monika Huber',
    role: 'Lehrerin',
    text: 'Seit einigen Wochen bin ich bei Diana im Kleingruppen Training und ich bin total begeistert. Nach kürzester Zeit schon fühle ich mich viel besser in meinem Körper. Ich habe mehr Körperspannung, habe mehr Energie und mein operiertes Knie schmerzt kaum noch.\n\nSie versteht es wie niemand sonst, mich für das Fitness zu motivieren, und sie hat das Feingefühl genau bis an meine Grenze zu gehen und diese leicht auszuweiten ohne dabei zu weit zu gehen. Sie weiss genau worauf es bei der Bewegung und der Übung ankommt und gibt exakte Instruktionen, wie die Übung gemacht werden muss, damit auch früher verletzte Körperteile geschont und gleichzeitig trainiert werden.\n\nDiana ist offen und herzlich und sie hat es geschafft, mich im Alter von 47 zum Fitness zu bewegen. In der kleinen Gruppe fühle ich mich wohl und sie betreut mich fast wie in einem Personal Training. Wem seine Gesundheit, sein Körpergefühl und sein Aussehen etwas wert ist, dem kann ich Diana als Trainerin wärmstens empfehlen! Fitness macht einfach Spass bei ihr.',
  },
  {
    name: 'Andrea Gut',
    role: null,
    text: 'Das Training bei Diana kann ich nur weiter empfehlen. Ihre Erfahrung und ihr Wissen gibt sie kompetent an uns Kunden weiter. Das Programm ist für viele Menschen und ihre Bedürfnisse machbar. Danke Diana, das Training bei dir macht mir Spass!',
  },
  {
    name: 'Marina Hunziker',
    role: null,
    text: 'Diana ist eine sehr gute und ausserordentlich kompetente Trainerin. Sie korrigiert falsche Trainings angewohnheiten auf gute Art und es ist lässig mit ihr zu trainieren. Nur zu empfehlen.',
  },
  {
    name: 'Martina Lindörfer-Karnafelova',
    role: null,
    text: 'Persönlich und professionell! Super Trainerin, profesionell und motiviert! Jeder Zeit weiter zu empfehlen. Danke und bis bald ;-)',
  },
  {
    name: 'Vecaribica',
    role: null,
    text: 'Bin seit fast einem Jahr bei Dj Training und bin immer noch begeistert am Tranieren. Mir gefällt das abwechslungsreiche Angebot und motivierende, kompetente, tolle und sympathische Trainerin. Alles in Allem: super empfehlenswert! Volle 5 Sterne. :–)',
  },
  {
    name: 'Martina Stratmann',
    role: null,
    text: 'Diana ist nicht nur eine ausgezeichnete Group-Fitness Leiterin sondern auch eine excellente Personal-Trainer. In nur wenigen Monaten hat sie es geschafft, meinen Körper zu modellieren mit effizienten Übungen, abgestimmt auf mein Alter und meine Physiologie, einfach brillant.',
  },
  {
    name: 'Michael Müller',
    role: null,
    text: 'Ich kann DJ Trainig nur Empfehlen. Ihre Traningspläne sind Umfangreich und angepasst an den Kunden. Es macht Spass bei so einer Top Trainerin betreut zu werden.',
  },
  {
    name: 'Sabine Do-Thuong',
    role: null,
    text: 'Als Ballsportler (Volleyball, Tennis) bewege ich mich grundsätzlich eigentlich nur wenn ein Ball in meiner Nähe ist. Dh Sportarten wie zB Joggen, Gruppen-Fitness, Schwimmen oder Krafttraining etc. waren für mich immer ein Graus. Habe alles mal ausprobiert, aber nichts hat mich motiviert weiterzumachen. Trotzdem wollte ich etwas machen um mein Körpergefühl zu verbessern. Auf der Suche nach einer Sportart bei der ich mit möglichst wenig Zeitaufwand den grössten Effekt erzielen kann, bin ich auf HIIT gestossen. Als ich gesehen habe, dass dies bei DJ\'s Training als Probelektion angeboten wird, versuchte ich es einfach mal. Seither gehe ich regelmässig ca. 2x pro Woche ins Training. Das Training ist sehr abwechslungsreich, ich kann mich nicht erinnern, dass es in bisher 3 Monaten einmal ein gleiches Training gab. Das ist für mich enorm wichtig, damit es motivierend bleibt, sonst hätte ich es vermutlich bereits wieder aufgegeben - wie gesagt, es ist ja kein Ball im Spiel :-) Diana findet dabei stets eine gute Balance aus streng sein und mich auf eine gute Art "in den Hintern zu treten", aber auch zu loben und anzuspornen, wenn sie weiss, dass ich gerade am Limit bin. Dementsprechend passt sie die Intensität und Schwierigkeitsstufe der Übungen falls nötig ad-hoc an. Bevor ich mit HIIT anfing, war mir nicht bewusst, wie unbeweglich ich war und dass meine Muskeln vom vielen Sitzen im Bürojob so verkürzt waren. Bereits nach wenigen Wochen habe ich deutliche Fortschritte bemerkt und darum motiviert es mich weiterhin HIIT zu machen. Vielen Dank, Diana, dass du mich quälst :-)',
  },
  {
    name: 'Myophysio',
    role: null,
    text: 'Diana ist ein sehr gute und motivierte Personal Trainer!',
  },
  {
    name: 'F.S.',
    role: null,
    text: 'Tolles Training! Ich trainiere seit 3 Jahren bei Diana. Die Personal-Trainings sind abwechslungsreich und durch ihre aufgestellte Art auch sehr lustig. Diana passt mein Trainingsplan nach einigen Wochen an, somit wird es mir nie langweilig und ich kann mich immer wieder aufs Neue herausfordern.\n\nDianas aufgestellte Art motivierte mich stets dran zu bleiben, auch als es Zeit brauchte, bis ich die ersten Resultate sehen konnte. Ich kann Diana nur weiterempfehlen.',
  },
  {
    name: 'Erika K.',
    role: null,
    text: 'Ich gehe seit 9 Monaten jeweils 2x pro Woche zu Diana ins Personal Training und ab und zu auch noch ins Gruppentraining und ich LIEBE es (und das, obwohl ich mir vor 10 Monaten noch nicht mal vorstellen hätte können, jemals Gewichte zu heben - geschweige denn, Spass daran zu haben)!\n\nMein Wunsch war es, meine Kondition zu verbessern...\nDas hab ich erreicht und noch so viel mehr!\nIch fühle mich viel stärker und kräftiger, habe eine bessere Ausdauer und auch einiges an Gewicht verloren.\n\nDiana betreut einen sehr kompetent und individuell, achtet darauf, dass die Übungen korrekt ausgeführt werden und fördert und motiviert einen genau im richtigen Mass. Ausserdem ist das Training total abwechslungsreich - und sogar meine Lieblingsmusik läuft schon immer, wenn ich ins Studio komme :D Da klappt das Training gleich noch viel besser! Ich kann das Training mit ihr wirklich von ganzem Herzen allen empfehlen!',
  },
  {
    name: 'Sukey',
    role: null,
    text: 'Was soll ich sagen? Keine Minute bereut bei Diana zu trainieren. Hatte nach den Schwangerschaften Schmerzen in den Rippengegend zig Mal Physio hat nicht geholfen. Nach 2 Mte Training ist der Schmerz weg. Ich habe sichtbar mehr Muskeln und eine verbesserte Körperhaltung. Fühle mich fit und stark. Bekomme viele Komplimente weil die Ergebnisse eifach sichtbar sind.\n\nHatte gerade eine Bauchoperation und stehe viel schneller wieder auf weil ich einfach kräftiger und mehr Vertrauen in meinem Körper habe💪🏻 Freue mich schon auf mein nächstes Training',
  },
  {
    name: 'Nicole Tellenbach',
    role: null,
    text: 'Ich gehe zwei Mal in der Woche zu Diana ins Personal Training. Immer wieder staune ich, wie viel ich, mit der Hilfe von Diana, schon erreicht habe. Sie motiviert, lobt und fordert genau im richtigen Mass. Nach jedem Training gehe ich müde, zufrieden und motiviert noch mehr zu schaffen nach Hause. Danke dafür Diana.',
  },
  {
    name: 'Regina Lanner',
    role: 'Ärztin',
    text: 'Wie aus einer Läuferin, eine begeisterte Kraftsportler wurde:\n\nIch bin nun über 10 Jahre Langstrecke gelaufen und irgendwie war die Luft draussen. Zu allem Übel kam noch der Lockdown und ohne Sport stiegen nicht nur die Kilos sondern auch die Rückenschmerzen. Es musste eine Lösung her. Nachdem ich ein Freundin nach 2 Jahren wiedertraf, sie war alles andere als sportlich, und die durchtrainiert vor mir stand, kam ich aus den Staunen nicht raus. Sie erzählte mir, dass sie Personal Training bei Diana macht. Ihr könnt mir glauben, als Läuferin, Krafttraining zu machen war mir ein Graus und im Vergleich zum „normalen" Fitness so viel Geld in die Hand zu nehmen auch. Dennoch war ich neugierig und ich vereinbarte Probetraining und alle Vorurteile waren weg.\n\nDiana schafft es einen zu motivieren und man bekommt ein komplett neues Körpergefühl. Meine Rückenschmerzen gehören der Vergangenheit an. So maches Speckröllchen hat sich verabschiedet und auch in Corona-Zeiten kann ich 3 x die Woche - angepasst an meine Arbeitszeiten - trainieren. Also ich kann nur allen Sagen, die auf der Suche nach professonieller Trainingsunterstützung sind - macht ein Probetraining aus.',
  },
  {
    name: 'Stefanie',
    role: null,
    text: 'Da ich mit einem vollen Zeitplan in einem Fitnesscenter nur als stiller Sponsor teilnehme würde, entschied ich mich für das Personaltraining. Mit Diana als Coach und super Motivatorin bin ich bis zu dreimal die Woche am Trainieren, da sie individuell auf mich und meine zeitlichen Möglichkeiten eingehen kann. Auch ein Training am Wochenende ist mal möglich. Dadurch habe ich das letzte halbe Jahr einen genialen Fortschritt erzielt. Vielen Dank Diana das Training mit dir macht einfach immer Spass!',
  },
  {
    name: 'BR',
    role: null,
    text: 'Das Training ist sehr abwechslungsreich und nie langweilig. Es gibt immer neue Übungen, neue Variationen und verschiedene Geräte wie Hanteln, Kettlebells, TRX, Bälle etc kommen zum Einsatz. Diana arbeitet sehr professionell. Eine Einheit besteht immer aus den Teilen Aufwärmen, Training und Cooldown mit Stretching. Somit habe ich fast keinen Muskelkater und nie Schmerzen. Das bei drei Trainings pro Woche. Diana achtet sehr genau darauf, dass man die Übung richtig macht und korrigiert die Haltung, falls nötig.\n\nAlles in allem das beste Training, das ich je hatte.',
  },
  {
    name: 'Juliana',
    role: 'Lehrerin',
    text: 'Ich besuche Dianas Gruppen-Training seit dem August und versuche wenn möglich Montag, Mittwoch und Freitag teilzunehmen. Ich freue mich immer. Die Stunden sind total abwechslungsreich und begleitet durch tolle, moderne Musik, welche mich motiviert. Diana leitet und coacht uns professionell und mit klarer Erwartungshaltung und gleichzeitig zeigt sie immer wieder Humor und ist für einen Witz zu haben.',
  },
  {
    name: 'Paula Cruz',
    role: null,
    text: 'Diana ist eine exzellente Trainerin. Seitdem ich bei ihr bin, fühle ich mich zunehmend motiviert um Sport zu machen und ein gesundes Lebensstill zu führen. Sie konzentriert sich auf meine Bedürfnisse und plant das perfekte Training für mich. Diana, danke Dir fühle ich mich jeden Tag besser mit mir selbst, sowohl körperlich als auch geistig. Ich bedanke mich vom ganzem Herzen...für die tolle Zeit, für dein Positivismus, für die Motivation... für alles!\n\nFreue mich auf unsere weitere Zusammenarbeit!!',
  },
];

function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

function TextWithParagraphs({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className={i < paragraphs.length - 1 ? 'mb-3' : ''}>
          {paragraph}
        </p>
      ))}
    </>
  );
}

export default function KundenstimmenContent() {
  const [selectedTestimonial, setSelectedTestimonial] = useState<number | null>(null);

  const closeModal = useCallback(() => {
    setSelectedTestimonial(null);
  }, []);

  useEffect(() => {
    if (selectedTestimonial === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedTestimonial, closeModal]);

  const selected = selectedTestimonial !== null ? testimonials[selectedTestimonial] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {/* Page heading */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">Kundenstimmen</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Meine Kundinnen und Kunden sind meine beste Empfehlung. Hier teilen sie ihre Erfahrungen
          und Ergebnisse aus dem Training bei DJ&apos;s Training.
        </p>
      </div>

      {/* Testimonials grid */}
      <div
        data-testid="testimonials-grid"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {testimonials.map((testimonial, index) => {
          const isLong = testimonial.text.length > PREVIEW_LENGTH;
          const previewText = isLong
            ? truncateAtWordBoundary(testimonial.text, PREVIEW_LENGTH) + '...'
            : testimonial.text;

          return (
            <article
              key={testimonial.name}
              className="flex flex-col rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 text-4xl leading-none text-rose-300">&ldquo;</div>
              <div className="mb-4 text-gray-700">
                <TextWithParagraphs text={previewText} />
              </div>
              {isLong && (
                <button
                  onClick={() => setSelectedTestimonial(index)}
                  className="mb-4 self-start text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Mehr lesen
                </button>
              )}
              <div className="mt-auto border-t border-gray-100 pt-4">
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                {testimonial.role && <p className="text-sm text-gray-500">{testimonial.role}</p>}
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl animate-fade-in overflow-y-auto rounded-xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Schliessen"
            >
              ×
            </button>
            <div className="mb-4 text-4xl leading-none text-rose-300">&ldquo;</div>
            <div className="mb-6 text-gray-700">
              <TextWithParagraphs text={selected.text} />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-bold text-gray-900">{selected.name}</p>
              {selected.role && <p className="text-sm text-gray-500">{selected.role}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Feedback CTA */}
      <section className="mt-16 rounded-lg bg-gray-50 p-8 text-center sm:p-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Deine Meinung zählt!</h2>
        <p className="mx-auto mb-6 max-w-xl text-gray-600">
          Bist du Kundin oder Kunde bei DJ&apos;s Training? Teile deine Erfahrung und hilf anderen,
          die richtige Entscheidung zu treffen.
        </p>
        <a
          href="mailto:info@dj-training.com?subject=Kundenstimme"
          className="inline-block rounded-full bg-rose-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-rose-700"
        >
          Feedback senden
        </a>
      </section>
    </div>
  );
}
