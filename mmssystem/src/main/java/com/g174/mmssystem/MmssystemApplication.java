package com.g174.mmssystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MmssystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(MmssystemApplication.class, args);
	}

}
