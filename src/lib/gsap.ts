import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

ScrollTrigger.config({ ignoreMobileResize: true })
gsap.defaults({ ease: 'power3.out', duration: 1 })

if (import.meta.env.DEV) Object.assign(window, { __ST: ScrollTrigger, __gsap: gsap })

export { gsap, ScrollTrigger, SplitText }
