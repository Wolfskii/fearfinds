interface HeroProps {
  type: 'color' | 'image' | 'video'
  content: {
    color?: string
    imageSrc?: string // Assuming the image source is a string
    videoSrc?: string
  }
  heading: string
  subheading: string
}

const Hero: React.FC<HeroProps> = ({ type, content, heading, subheading }) => {
  return (
    <div className={`hero ${type}`}>
      {type === 'color' && <div className='color' style={{ backgroundColor: content.color }} />}
      {type === 'image' && <Image src='/app/assets/images/hero-example.jpeg' alt="Hero image"/>}
      {type === 'video' && (
        <video className='video' autoPlay loop muted>
          <source src={content.videoSrc} type='video/mp4' />
          Your browser does not support the video tag.
        </video>
      )}

      <div className='content'>
        <h1>{heading}</h1>
        <p>{subheading}</p>
      </div>
    </div>
  )
}

export default Hero
