import { createContext, useContext, useState, useCallback } from "react";

const translations = {
  en: {
    // Navbar
    search: "Search Tlacobook",
    home: "Home",
    friends: "Friends",
    messenger: "Messenger",
    marketplace: "Marketplace",
    notifications: "Notifications",
    darkMode: "Dark Mode",
    language: "Language",
    logout: "Log Out",
    noNotifications: "No notifications",

    // Home sidebar
    findFriends: "Find Friends",
    activityFeed: "Activity Feed",

    // Home feed
    welcomeTitle: "Welcome to Tlacobook!",
    welcomeText: "Add friends to see their posts in your feed.",
    loadMore: "Load more",
    peopleYouMayKnow: "People you may know",
    contacts: "Contacts",
    noFriendsOnline: "No friends online",
    creatingPost: "Creating your post...",

    // Create post
    whatsOnYourMind: "What's on your mind",
    mentionHint: "(@ to mention)",
    media: "Media",
    feeling: "Feeling",
    post: "Post",
    posting: "Posting...",

    // Post
    like: "Like",
    comment: "Comment",
    share: "Share",
    deletePost: "Delete this post?",
    writeComment: "Write a comment...",
    reply: "Reply",
    replies: "replies",
    viewReplies: "View",
    hideReplies: "Hide replies",
    writeReply: "Write a reply...",
    pinned: "Pinned Post",
    feelingText: "is feeling",

    // Friends
    friendRequests: "Friend Requests",
    noPendingRequests: "No pending friend requests",
    confirm: "Confirm",
    delete: "Delete",
    friendSuggestions: "Friend Suggestions",
    noSuggestions: "No suggestions right now",
    addFriend: "Add Friend",
    pending: "Pending",
    yourFriends: "Your Friends",
    noFriendsYet: "No friends yet. Start connecting!",
    mutualFriends: "mutual friends",
    allFriends: "All Friends",

    // Profile
    editProfile: "Edit Profile",
    save: "Save",
    cancel: "Cancel",
    message: "Message",
    unfriend: "Unfriend",
    acceptRequest: "Accept Request",
    pendingSent: "Request Sent",
    firstName: "First Name",
    lastName: "Last Name",
    bio: "Bio",
    livesIn: "Lives in",
    from: "From",
    relationship: "Relationship",
    workplace: "Works at",
    friendsSection: "Friends",
    posts: "Posts",
    noPosts: "No posts yet",
    photos: "Photos",
    noPhotos: "No photos yet",
    privateProfile: "This profile is private",
    privateProfileDesc: "Only friends can see this profile's posts and information.",
    profilePrivacy: "Profile Privacy",
    publicProfile: "Public",
    privateProfileLabel: "Private",

    // Messenger
    chats: "Chats",
    newChat: "New Chat",
    searchConversations: "Search conversations",
    selectConversation: "Select a conversation",
    selectConversationDesc: "Choose a chat from the sidebar to start messaging",
    typeMessage: "Type a message...",
    online: "Online",
    typing: "typing...",
    newGroup: "New Group",
    groupName: "Group name",
    createGroup: "Create Group",
    searchFriends: "Search friends...",
    addMembers: "Add Members",
    members: "Members",
    leaveGroup: "Leave Group",
    groupSettings: "Group Settings",
    remove: "Remove",

    // Marketplace
    marketplaceTitle: "Marketplace",
    searchMarketplace: "Search Marketplace",
    sellSomething: "Sell Something",
    noListings: "No listings found. Be the first to sell something!",
    createListing: "Create New Listing",
    title: "Title",
    price: "Price",
    description: "Description",
    category: "Category",
    condition: "Condition",
    location: "Location",
    publishListing: "Publish Listing",
    publishing: "Publishing...",
    messageSeller: "Message Seller",
    markAsSold: "Mark as Sold",
    markAvailable: "Mark Available",
    deleteListing: "Delete",
    back: "Back",
    addPhotos: "Add Photos",
    sold: "SOLD",

    // Stories
    createStory: "Create Story",
    yourStory: "Your story",
    shareToStory: "Share to Story",
    sharing: "Sharing...",
    writeSomething: "Write something...",
    background: "Background",
    textStyle: "Text Style",
    font: "Font",
    solidColors: "Solid Colors",
    gradients: "Gradients",
    addPhoto: "Add Photo",
    changePhoto: "Change Photo",
    textColor: "Text Color",
    textPosition: "Text Position",
    alignment: "Alignment",
    fontFamily: "Font Family",
    fontSize: "Font Size",
    top: "Top",
    center: "Center",
    bottom: "Bottom",
    preview: "Preview",

    // Activity
    activityTitle: "Activity Feed",
    activitySubtitle: "See what your friends have been up to",
    noActivity: "No activity yet. Add friends to see their activity!",
    likedAPost: "liked a post",
    commentedOnAPost: "commented on a post",
    becameFriendsWith: "became friends with",
    sharedANewPost: "shared a new post",

    // Categories
    all: "All",
    electronics: "Electronics",
    vehicles: "Vehicles",
    furniture: "Furniture",
    clothing: "Clothing",
    homeCategory: "Home",
    sports: "Sports",
    toys: "Toys",
    other: "Other",

    // Conditions
    new: "New",
    likeNew: "Like New",
    good: "Good",
    used: "Used",

    // Auth
    login: "Log In",
    register: "Create new account",
    email: "Email address",
    password: "Password",
    connectText: "Connect with friends and the world around you on Tlacobook.",
    loginFailed: "Login failed",
    invalidCredentials: "Invalid credentials",
    registerTitle: "Sign Up",
    registerSubtitle: "It's quick and easy.",
    alreadyHaveAccount: "Already have an account?",
    backToFeed: "Back to Feed",
  },

  es: {
    // Navbar
    search: "Buscar en Tlacobook",
    home: "Inicio",
    friends: "Amigos",
    messenger: "Mensajes",
    marketplace: "Tienda",
    notifications: "Notificaciones",
    darkMode: "Modo Oscuro",
    language: "Idioma",
    logout: "Cerrar Sesión",
    noNotifications: "Sin notificaciones",

    // Home sidebar
    findFriends: "Buscar Amigos",
    activityFeed: "Actividad",

    // Home feed
    welcomeTitle: "¡Bienvenido a Tlacobook!",
    welcomeText: "Agrega amigos para ver sus publicaciones.",
    loadMore: "Cargar más",
    peopleYouMayKnow: "Personas que quizás conozcas",
    contacts: "Contactos",
    noFriendsOnline: "No hay amigos en línea",
    creatingPost: "Creando tu publicación...",

    // Create post
    whatsOnYourMind: "¿Qué estás pensando",
    mentionHint: "(@ para mencionar)",
    media: "Multimedia",
    feeling: "Sentimiento",
    post: "Publicar",
    posting: "Publicando...",

    // Post
    like: "Me gusta",
    comment: "Comentar",
    share: "Compartir",
    deletePost: "¿Eliminar esta publicación?",
    writeComment: "Escribe un comentario...",
    reply: "Responder",
    replies: "respuestas",
    viewReplies: "Ver",
    hideReplies: "Ocultar respuestas",
    writeReply: "Escribe una respuesta...",
    pinned: "Publicación Fijada",
    feelingText: "se siente",

    // Friends
    friendRequests: "Solicitudes de Amistad",
    noPendingRequests: "No hay solicitudes pendientes",
    confirm: "Confirmar",
    delete: "Eliminar",
    friendSuggestions: "Sugerencias de Amigos",
    noSuggestions: "Sin sugerencias por ahora",
    addFriend: "Agregar Amigo",
    pending: "Pendiente",
    yourFriends: "Tus Amigos",
    noFriendsYet: "Sin amigos aún. ¡Empieza a conectar!",
    mutualFriends: "amigos en común",
    allFriends: "Todos los Amigos",

    // Profile
    editProfile: "Editar Perfil",
    save: "Guardar",
    cancel: "Cancelar",
    message: "Mensaje",
    unfriend: "Eliminar Amigo",
    acceptRequest: "Aceptar Solicitud",
    pendingSent: "Solicitud Enviada",
    firstName: "Nombre",
    lastName: "Apellido",
    bio: "Biografía",
    livesIn: "Vive en",
    from: "De",
    relationship: "Relación",
    workplace: "Trabaja en",
    friendsSection: "Amigos",
    posts: "Publicaciones",
    noPosts: "Sin publicaciones aún",
    photos: "Fotos",
    noPhotos: "Sin fotos aún",
    privateProfile: "Este perfil es privado",
    privateProfileDesc: "Solo los amigos pueden ver las publicaciones e información de este perfil.",
    profilePrivacy: "Privacidad del Perfil",
    publicProfile: "Público",
    privateProfileLabel: "Privado",

    // Messenger
    chats: "Chats",
    newChat: "Nuevo Chat",
    searchConversations: "Buscar conversaciones",
    selectConversation: "Selecciona una conversación",
    selectConversationDesc: "Elige un chat para empezar a mensajear",
    typeMessage: "Escribe un mensaje...",
    online: "En línea",
    typing: "escribiendo...",
    newGroup: "Nuevo Grupo",
    groupName: "Nombre del grupo",
    createGroup: "Crear Grupo",
    searchFriends: "Buscar amigos...",
    addMembers: "Agregar Miembros",
    members: "Miembros",
    leaveGroup: "Salir del Grupo",
    groupSettings: "Configuración del Grupo",
    remove: "Eliminar",

    // Marketplace
    marketplaceTitle: "Tienda",
    searchMarketplace: "Buscar en Tienda",
    sellSomething: "Vender Algo",
    noListings: "No hay publicaciones. ¡Sé el primero en vender algo!",
    createListing: "Crear Nueva Publicación",
    title: "Título",
    price: "Precio",
    description: "Descripción",
    category: "Categoría",
    condition: "Condición",
    location: "Ubicación",
    publishListing: "Publicar",
    publishing: "Publicando...",
    messageSeller: "Mensaje al Vendedor",
    markAsSold: "Marcar como Vendido",
    markAvailable: "Marcar Disponible",
    deleteListing: "Eliminar",
    back: "Volver",
    addPhotos: "Agregar Fotos",
    sold: "VENDIDO",

    // Stories
    createStory: "Crear Historia",
    yourStory: "Tu historia",
    shareToStory: "Compartir Historia",
    sharing: "Compartiendo...",
    writeSomething: "Escribe algo...",
    background: "Fondo",
    textStyle: "Estilo de Texto",
    font: "Fuente",
    solidColors: "Colores Sólidos",
    gradients: "Degradados",
    addPhoto: "Agregar Foto",
    changePhoto: "Cambiar Foto",
    textColor: "Color de Texto",
    textPosition: "Posición del Texto",
    alignment: "Alineación",
    fontFamily: "Tipo de Fuente",
    fontSize: "Tamaño de Fuente",
    top: "Arriba",
    center: "Centro",
    bottom: "Abajo",
    preview: "Vista Previa",

    // Activity
    activityTitle: "Actividad",
    activitySubtitle: "Mira lo que tus amigos han estado haciendo",
    noActivity: "Sin actividad aún. ¡Agrega amigos para ver su actividad!",
    likedAPost: "le dio me gusta a una publicación",
    commentedOnAPost: "comentó en una publicación",
    becameFriendsWith: "se hizo amigo de",
    sharedANewPost: "compartió una nueva publicación",

    // Categories
    all: "Todos",
    electronics: "Electrónica",
    vehicles: "Vehículos",
    furniture: "Muebles",
    clothing: "Ropa",
    homeCategory: "Hogar",
    sports: "Deportes",
    toys: "Juguetes",
    other: "Otro",

    // Conditions
    new: "Nuevo",
    likeNew: "Como Nuevo",
    good: "Bueno",
    used: "Usado",

    // Auth
    login: "Iniciar Sesión",
    register: "Crear cuenta nueva",
    email: "Correo electrónico",
    password: "Contraseña",
    connectText: "Conéctate con amigos y el mundo a tu alrededor en Tlacobook.",
    loginFailed: "Error al iniciar sesión",
    invalidCredentials: "Credenciales inválidas",
    registerTitle: "Registrarse",
    registerSubtitle: "Es rápido y fácil.",
    alreadyHaveAccount: "¿Ya tienes cuenta?",
    backToFeed: "Volver al Inicio",
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "es" : "en";
      localStorage.setItem("lang", next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((l) => {
    localStorage.setItem("lang", l);
    setLang(l);
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] || translations.en[key] || key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
