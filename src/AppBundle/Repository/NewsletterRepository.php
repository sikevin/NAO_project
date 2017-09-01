<?php

namespace AppBundle\Repository;

/**
 * NewsletterRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class NewsletterRepository extends \Doctrine\ORM\EntityRepository
{
	public function findValidEmail()
	{
		$query = $this->_em->createQuery('SELECT n.email FROM AppBundle:Newsletter n');

		return $query->getResult();
	}
}
