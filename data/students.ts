export type Student = {
  id: string;
  name: string;
  grade: string;
  section?: string;
};

type Roster = Record<string, readonly string[]>;

const roster: Roster = {
  K: [
    'Amari Dowdy', 'Kaiden Lee', 'Dariel Torres', 'Thiago Vargas Aguilera', 'Eliana Zamora',
    'Catalina Prince', 'Leila Nunez', 'Leon Ortega', 'Antoine Carter', 'Ivan Avina-Gonzalez',
    'Maddysyn Alvarenga', 'Leilani DeLaRosa-Mendoza', 'Kiarybel Velazquez-Alvarenga', 'Valeria Coria',
    'Sebastian Eke', 'Harlee Hamilton', "Ma'raiya Colbert", 'Mateo Aguilar-Aviles', 'Iyana Darden',
    'Zoey Grihalba', 'Kaziah Haley', 'Haidyn Valentine',
  ],
  '1': [
    'Sol Aviles', 'Bella Bertram', 'Dylan Castillo', 'Eliya Chance', 'Lucas De La Cruz',
    'Benjamin Frias', 'Ariana Galindo', 'Aylani Gomez', 'Sarah Jackson', 'Karim Quezada Lopez',
    'Mariana Quintero', 'Alejandro Revimar', 'Nevaeh Rion', 'Carlos Rios', 'Pia Williamson',
    'Santiago Zepeda Duran', 'Ulices Molina', 'Emilio Arano', 'Isabella Espinosa-Sanchez',
    'Zoe Hamilton', 'Leandro Alanis', 'Rey Gomez', 'Zakhai Mantey', 'Jordyn Tyson',
  ],
  '2': [
    'Ameera Carter', 'Armoni Dowdy', 'Eliceo Gonon', 'Josue Gonon', 'Aiden Gutierrez',
    'Emiliano Gutierrez', 'Juliet Hernandez', 'Lea Hernandez Alvarenga', 'Neil Joseph',
    'Betsabel Lara Sosa', 'Khynlee Martin', 'Jossiah Mccullough', 'Joshua Mendoza',
    'Andru Zaid Mondragon Trujillo', 'Gael Romero Morales', 'Gael Ruiz', 'Sekhani Simmons-Vertison',
    'Adrian Yanez Jasso', 'Olivia Zamora', 'Kayden Morgan', 'Selena Ramos Rangel', 'Ava Meribe',
    'Elijah Lewis', 'Rosabelle Espinoza-Sanchez', 'Michael Salinas', 'Mateo Tinoco', 'Silas Haley',
    'Jaylene Rico Adame',
  ],
  '3A': [
    'Ivanna Barahona-Bravo', 'Arriya Chambers', 'Hailey Gomez', 'Virginia Gonzalez',
    'Nicholas Hernandez', 'Valencia Johnson', 'Bethany King', 'Ashley Leon', 'Lena Morales',
    'Clarissa Odamah', 'Arlette Perez', 'Amara Prado', 'Alyssa Reid', 'Arturo Revimar',
    'Layza Rivera-Vidales', 'Sophia Silva', "Ta'Kyrie Welch", 'Genesis Ovalle', 'Daniel Rodriguez',
    'Frederico Ceja Prado',
  ],
  '3B': [
    'Anderson Carcamo-Ortega', 'Izael Carmona', 'Zoe Castillo', 'Romina Gonzalez',
    'Nathaniel Jones', 'Santiago Julian', 'Genesis Lianres-Mares', 'Juliet Martinez-Alvarenga',
    'Natalie Mendoza', 'Alexa Olmeda', 'Alyssa Ortiz', 'Penelope Quintero-Alba',
    'Tiana Rodriguez-Garcia', 'Yareli Ruiz-Martinez', 'Joseph Tavera', 'Aiden Armijo',
    'Cristian Deleon', 'Isabella Romero', 'Noe Arrellanes', 'Alejandra Chavez', 'Tylind Marshall-Head',
  ],
  '4': [
    'Nathalie Benitez', 'Victoria Coria', 'Azazel Harris Guerra', 'Esther Hernandez Alvarenga',
    'Nyla Joseph', 'Major Madison', 'Emma Martinez', 'Madalyn Moreno', 'Raziel Romero',
    'Nicholas Shah', 'Champion Taylor', 'Reagyn Taylor', 'Ella Triplett', 'Frida Dominguez',
    'Max Arciva-Martinez', 'Eiden Rodriguez', 'Janari Bradley', 'Moises Gomez', 'Lee Gonzalez',
    'Journee Tyson', 'Kensli Williams',
  ],
  '5A': [
    'Aiden Aguilar', 'Ariel Aguilar', 'Mykael Alvarenga', 'Jacob Beltran', 'Alisandra Campos',
    'Camila Ceron', 'Yasmine Clark', 'Joshua Corralejo', 'Kayla Green', 'Elias Hall',
    'Ayden Johnson', 'Gloria Jones', 'Yesemi Lara', 'Zamaya Smith', 'Nathan Tabora-Molina',
    'Jenaro Terrazas', 'Daniella Vazquez-Sandate', 'Adelynn Aguilar', 'Laura Diego',
  ],
  '5B': [
    'Christopher Aguilar-Gomez', 'Jose Brito-Guardado', 'Isabella Bado', 'Amora Carter',
    'Jacob Jordan', 'Rhylee Martin', 'Dylan Mondragon-Trujillo', 'Miley Nguyen', 'Isair Olmeda',
    'Mikeyla Perez', 'Alexis Rivera-Canales', 'Jayonni Vertison', 'Natalie Williamson',
    'Alexia Alvina-Gonzalez', 'Alexander Delarosa', 'Michael Rogers', 'Kevin Garcia', 'Natalie Luna',
    'Anthony Silva', 'Madylynn Mendoza',
  ],
  '6A': [
    'Alexandra Alonso', 'Mateo Benitez', 'Kendra Flores-DeSantiago', 'Hector Gonzalez-Laureano',
    'Zaylee Hamilton', 'Vivienne Harris-Guerra', 'Daleyza Hernandez', 'Sabine Jimenez',
    'Jacob Moreno', 'Damian Rodriguez', 'Haylee Tavera', 'Jade Llanas',
    'Nathalia Rodriguez-Sequera', 'Liosmel Ortega', 'Alex Rojas', 'Devin Roberson',
    'Jayden Acevedo Adame', 'Diego Borjas', 'Dakarion Forest', 'Kyrie Harris',
  ],
  '6B': [
    'Alberto Benitez', 'Evelyn Galindo', 'Ramses Gonzales', 'Abigail Gonzales-Cervantez',
    'Trinity Johnson', 'Camila Molina', 'Ezequiel Perez', 'Anelie Pinales',
    'Matthew Quintero', 'Dylan Tabora-Molina', 'Ethan Torres', 'Jacob Ulloa', 'Ridlee Lopez',
    'Daniella Romero', 'Fatima Alsamahi', 'Lindsay Luna', 'Peyton Harris', 'Gianna Jeronimo',
    'Cayden Pearson', 'Sophia Rodriguez Sequera',
  ],
  '7A': [
    'Vonnie Alanis', 'Elisa Benitez', 'Brayden Bertram', 'Paola Chavez', 'Evelyn Robles',
    'Joshua Farrar', 'Kenneth Gonzalez', 'Bryzon Grant', 'Matthew Mendoza', 'Alexa Perez',
    'Samuel Williamson', 'Blake Ayala', 'Danica Dominguez', 'Jesus Lara-Garcia',
    'Jose Rodriguez-Lopez', 'Angel Martinez', 'Preston Kramer', "Ja'Kaylen Allen", 'Allen Bradley',
    'Alana Clark', 'Jeremiah Clement', 'Markus Colbert', 'Arianna Corralejo', 'Susana Frias',
    'Brayden King', 'Jay Ortiz', 'Keyner Perez', 'Carlos Revimar', 'Sofia Rivas-Alvarenga',
    'Evelyn De La Cruz', 'Isabella Vazquez', 'Paul Williams', 'Abdullah Alsamahi', 'Jordan Eke',
    'Deajah Forest',
  ],
  '8A': [
    'Christopher Aguilar-Borrego', 'Wilson Armendariz', 'Jafeth Barahona', 'Armani Carter',
    'Franciso De La Cruz', 'Makenzie Englebrecht', 'Alfredo Galvan', 'Azrael Harris-Guerra',
    'Arturo Hernandez', 'Ivyanna Madison', 'Carly Molina', 'Aaron Montanez', 'Allison Olmeda',
    'Alexis Roman', 'Khyvon Royals', 'Jonathan Tavera', 'Amy Torres', 'Canelo Vasquez',
    'Evan Varela', 'Mateo Rodriguez',
  ],
  '8B': [
    'Erick Anaya-Jimenz', 'Abigail Arranda-Gomez', 'Brayan Campos-Contreras',
    'Casye Flores-DeSantiago', 'Sarah Garcia', 'Andres Gonzalez-Laureano', 'Nathan Guitierrez',
    'Liz Guzman', 'Nathan Madison', 'Dariel Palacios', 'Ariella Pinales', 'Elimar Ramirez',
    'Edwin Rivera-Vidales', 'Juliebeth Rocha', 'Jacob Rodriguez', 'Dania Terrazas-Areola',
    'Sophie Triplet', "Sema'J Ward", 'Edgar Rodriguez', 'Amber Costello', 'Lorrion Pearson',
  ],
};

function studentId(grade: string, name: string): string {
  return `${grade}-${name}`
    .toLocaleLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Local, frontend-only student roster. */
export const students: Student[] = Object.entries(roster).flatMap(([group, names]) => {
  const grade = group.charAt(0);
  const section = group.length > 1 ? group : undefined;

  return names.map((name) => ({
    id: studentId(grade, name),
    name,
    grade,
    ...(section ? { section } : {}),
  }));
});

export const grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
