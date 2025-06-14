package com.techforu.chatapp.config;

import org.springframework.context.annotation.Configuration;


@Configuration
public class GraphQLConfig {
   /* @Bean
    public WebGraphQlInterceptor corsInterceptor() {
        return new WebGraphQlInterceptor() {
            @Override
            public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
                return chain.next(request).map(response -> {
                    response.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:4200");
                    response.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                    response.getResponseHeaders().add("Access-Control-Allow-Headers", "*");
                    response.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
                    return response;
                });
            }
        };
    }*/
}